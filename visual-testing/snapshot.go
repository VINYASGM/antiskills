package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/playwright-community/playwright-go"
	"go.uber.org/zap"
)

type DOMElement struct {
	ID      string   `json:"id"`
	TagName string   `json:"tagName"`
	Text    string   `json:"text"`
	X       float64  `json:"x"`
	Y       float64  `json:"y"`
	Width   float64  `json:"width"`
	Height  float64  `json:"height"`
	Classes []string `json:"classes"`
}

func CaptureSnapshot(targetURL string, outputDir string) error {
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	logger.Info("Initializing Playwright", zap.String("url", targetURL), zap.String("outputDir", outputDir))

	// Ensure output directory exists
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Install/Start Playwright driver
	err := playwright.Install()
	if err != nil {
		return fmt.Errorf("failed to install playwright driver: %w", err)
	}

	pw, err := playwright.Run()
	if err != nil {
		return fmt.Errorf("failed to run playwright: %w", err)
	}
	defer pw.Stop()

	// Launch headless Chromium
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true),
	})
	if err != nil {
		return fmt.Errorf("failed to launch chromium: %w", err)
	}
	defer browser.Close()

	// Viewport definitions
	viewports := []struct {
		Name   string
		Width  int
		Height int
	}{
		{"mobile", 375, 667},
		{"tablet", 768, 1024},
		{"desktop", 1440, 900},
	}

	var capturedElements []DOMElement

	for _, vp := range viewports {
		logger.Info("Capturing viewport layout", zap.String("viewport", vp.Name), zap.Int("width", vp.Width), zap.Int("height", vp.Height))

		// Create isolated context for the viewport
		context, err := browser.NewContext(playwright.BrowserNewContextOptions{
			Viewport: &playwright.Size{
				Width:  vp.Width,
				Height: vp.Height,
			},
		})
		if err != nil {
			return fmt.Errorf("failed to create browser context for %s: %w", vp.Name, err)
		}

		page, err := context.NewPage()
		if err != nil {
			context.Close()
			return fmt.Errorf("failed to create page for %s: %w", vp.Name, err)
		}

		// Navigate to target URL
		_, err = page.Goto(targetURL, playwright.PageGotoOptions{
			WaitUntil: playwright.WaitUntilStateNetworkidle,
		})
		if err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to navigate to %s: %w", targetURL, err)
		}

		// Save screenshot
		shotPath := filepath.Join(outputDir, fmt.Sprintf("viewport_%s.png", vp.Name))
		_, err = page.Screenshot(playwright.PageScreenshotOptions{
			Path: playwright.String(shotPath),
		})
		if err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to capture screenshot for %s: %w", vp.Name, err)
		}
		logger.Info("Screenshot saved", zap.String("path", shotPath))

		// If it's desktop, extract DOM structure elements
		if vp.Name == "desktop" {
			logger.Info("Extracting DOM structure elements from desktop viewport")
			evalResult, err := page.Evaluate(`() => {
				const elements = [];
				const all = document.querySelectorAll('body *');
				for (const el of all) {
					const rect = el.getBoundingClientRect();
					if (rect.width > 0 && rect.height > 0) {
						elements.push({
							id: el.id || "",
							tagName: el.tagName,
							text: el.innerText ? el.innerText.trim().substring(0, 100) : "",
							x: rect.x,
							y: rect.y,
							width: rect.width,
							height: rect.height,
							classes: Array.from(el.classList)
						});
					}
				}
				return elements;
			}`)
			if err != nil {
				page.Close()
				context.Close()
				return fmt.Errorf("failed to evaluate DOM serialization script: %w", err)
			}

			// Marshal and unmarshal evaluation result into structures
			evalBytes, err := json.Marshal(evalResult)
			if err != nil {
				page.Close()
				context.Close()
				return fmt.Errorf("failed to marshal DOM elements: %w", err)
			}

			err = json.Unmarshal(evalBytes, &capturedElements)
			if err != nil {
				page.Close()
				context.Close()
				return fmt.Errorf("failed to unmarshal DOM elements into DOMElement structs: %w", err)
			}
		}

		page.Close()
		context.Close()
	}

	// Write captured desktop DOM elements to JSON
	domPath := filepath.Join(outputDir, "dom_structure.json")
	domBytes, err := json.MarshalIndent(capturedElements, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to serialize dom_structure.json: %w", err)
	}

	if err := os.WriteFile(domPath, domBytes, 0644); err != nil {
		return fmt.Errorf("failed to write dom_structure.json: %w", err)
	}
	logger.Info("DOM structure serialization completed", zap.String("path", domPath), zap.Int("elements", len(capturedElements)))

	return nil
}
