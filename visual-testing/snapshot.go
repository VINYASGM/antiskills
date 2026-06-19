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
	ID            string   `json:"id"`
	TagName       string   `json:"tagName"`
	Text          string   `json:"text"`
	X             float64  `json:"x"`
	Y             float64  `json:"y"`
	Width         float64  `json:"width"`
	Height        float64  `json:"height"`
	PaddingTop    float64  `json:"paddingTop"`
	PaddingRight  float64  `json:"paddingRight"`
	PaddingBottom float64  `json:"paddingBottom"`
	PaddingLeft   float64  `json:"paddingLeft"`
	Classes       []string `json:"classes"`
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

		// Extract DOM structure elements for this viewport
		logger.Info("Extracting DOM structure elements", zap.String("viewport", vp.Name))
		evalResult, err := page.Evaluate(`() => {
			const elements = [];
			const all = document.querySelectorAll('body *');
			for (const el of all) {
				const rect = el.getBoundingClientRect();
				if (rect.width > 0 && rect.height > 0) {
					const style = window.getComputedStyle(el);
					elements.push({
						id: el.id || "",
						tagName: el.tagName,
						text: el.innerText ? el.innerText.trim().substring(0, 100) : "",
						x: rect.x,
						y: rect.y,
						width: rect.width,
						height: rect.height,
						paddingTop: parseFloat(style.paddingTop) || 0,
						paddingRight: parseFloat(style.paddingRight) || 0,
						paddingBottom: parseFloat(style.paddingBottom) || 0,
						paddingLeft: parseFloat(style.paddingLeft) || 0,
						classes: Array.from(el.classList)
					});
				}
			}
			return elements;
		}`)
		if err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to evaluate DOM serialization script for %s: %w", vp.Name, err)
		}

		// Marshal and unmarshal evaluation result into structures
		evalBytes, err := json.Marshal(evalResult)
		if err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to marshal DOM elements for %s: %w", vp.Name, err)
		}

		var viewportElements []DOMElement
		err = json.Unmarshal(evalBytes, &viewportElements)
		if err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to unmarshal DOM elements into DOMElement structs for %s: %w", vp.Name, err)
		}

		// Write viewport-specific JSON file
		vpPath := filepath.Join(outputDir, fmt.Sprintf("dom_structure_%s.json", vp.Name))
		vpBytes, err := json.MarshalIndent(viewportElements, "", "  ")
		if err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to serialize dom_structure_%s.json: %w", vp.Name, err)
		}
		if err := os.WriteFile(vpPath, vpBytes, 0644); err != nil {
			page.Close()
			context.Close()
			return fmt.Errorf("failed to write dom_structure_%s.json: %w", vp.Name, err)
		}
		logger.Info("DOM structure serialization completed for viewport", zap.String("viewport", vp.Name), zap.String("path", vpPath), zap.Int("elements", len(viewportElements)))

		if vp.Name == "desktop" {
			// Save copy to dom_structure.json for backward compatibility
			domPath := filepath.Join(outputDir, "dom_structure.json")
			if err := os.WriteFile(domPath, vpBytes, 0644); err != nil {
				page.Close()
				context.Close()
				return fmt.Errorf("failed to write dom_structure.json: %w", err)
			}
			logger.Info("DOM structure backward compatibility copy saved", zap.String("path", domPath))
		}

		page.Close()
		context.Close()
	}

	return nil
}
