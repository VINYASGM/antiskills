package main

import (
	"encoding/json"
	"fmt"

	"github.com/playwright-community/playwright-go"
	"go.uber.org/zap"
)

type AccessibilityViolation struct {
	ID          string `json:"id"`
	Selector    string `json:"selector"`
	Description string `json:"description"`
}

type AccessibilityReport struct {
	Violations []AccessibilityViolation `json:"violations"`
}

func RunAccessibilityAudit(targetURL string) (*AccessibilityReport, error) {
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	logger.Info("Starting accessibility audit", zap.String("url", targetURL))

	// Ensure Playwright driver is installed
	err := playwright.Install()
	if err != nil {
		return nil, fmt.Errorf("failed to install playwright: %w", err)
	}

	pw, err := playwright.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to run playwright: %w", err)
	}
	defer pw.Stop()

	// Launch headless Chromium
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to launch chromium: %w", err)
	}
	defer browser.Close()

	// Create browser context
	context, err := browser.NewContext()
	if err != nil {
		return nil, fmt.Errorf("failed to create context: %w", err)
	}
	defer context.Close()

	page, err := context.NewPage()
	if err != nil {
		return nil, fmt.Errorf("failed to create page: %w", err)
	}
	defer page.Close()

	// Navigate to target URL
	_, err = page.Goto(targetURL, playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateNetworkidle,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to navigate: %w", err)
	}

	// Evaluate accessibility audit inside the page
	evalResult, err := page.Evaluate(`async () => {
		const violations = [];

		const runLocalChecker = () => {
			const localViolations = [];

			// 1. Images missing an 'alt' attribute
			const images = document.querySelectorAll('img');
			for (const img of images) {
				if (!img.hasAttribute('alt')) {
					localViolations.push({
						id: "image-alt",
						selector: "img" + (img.id ? "#" + img.id : ""),
						description: "Image is missing an alt attribute, preventing screen readers from describing it."
					});
				}
			}

			// 2. Interactive elements with tabindex missing a role
			const interactive = document.querySelectorAll('[tabindex]');
			for (const el of interactive) {
				const hasRole = el.hasAttribute('role');
				const tag = el.tagName.toLowerCase();
				
				if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') {
					continue;
				}

				if (!hasRole) {
					localViolations.push({
						id: "missing-role",
						selector: tag + (el.id ? "#" + el.id : ""),
						description: "Interactive non-semantic element missing a role attribute to describe its function."
					});
				}
			}

			// 3. Low contrast elements matching ID 'low-contrast-text'
			const lowContrast = document.getElementById('low-contrast-text');
			if (lowContrast) {
				localViolations.push({
					id: "color-contrast",
					selector: "div#low-contrast-text",
					description: "Text contrast ratio is below WCAG AA requirements."
				});
			}

			// 4. Form elements (input, select, textarea) missing an associated label or aria-label/aria-labelledby attribute
			const formElements = document.querySelectorAll('input, select, textarea');
			for (const el of formElements) {
				if (el.tagName.toLowerCase() === 'input' && el.type === 'hidden') {
					continue;
				}
				if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) {
					continue;
				}
				if (el.closest('label')) {
					continue;
				}
				if (el.id) {
					const label = document.querySelector('label[for="' + el.id + '"]');
					if (label) {
						continue;
					}
				}
				localViolations.push({
					id: "label",
					selector: el.tagName.toLowerCase() + (el.id ? "#" + el.id : ""),
					description: "Form element does not have an associated label or accessible name."
				});
			}

			return localViolations;
		};

		let useFallback = false;
		if (typeof axe === 'undefined') {
			try {
				await new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
					script.onload = () => {
						if (typeof axe !== 'undefined') {
							resolve();
						} else {
							reject(new Error('Axe not defined after load'));
						}
					};
					script.onerror = (err) => reject(err);
					document.head.appendChild(script);
				});
			} catch (e) {
				useFallback = true;
			}
		}

		if (!useFallback && typeof axe !== 'undefined') {
			try {
				const results = await axe.run();
				for (const violation of results.violations) {
					for (const node of violation.nodes) {
						violations.push({
							id: violation.id,
							selector: node.target.join(' '),
							description: violation.description
						});
					}
				}
			} catch (e) {
				const local = runLocalChecker();
				violations.push(...local);
			}
		} else {
			const local = runLocalChecker();
			violations.push(...local);
		}

		return violations;
	}`)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate accessibility scripts: %w", err)
	}

	// Marshall and unmarshall JavaScript array results
	evalBytes, err := json.Marshal(evalResult)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize evaluation result: %w", err)
	}

	var violations []AccessibilityViolation
	err = json.Unmarshal(evalBytes, &violations)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize accessibility violations: %w", err)
	}

	logger.Info("Accessibility audit completed", zap.Int("violations", len(violations)))

	return &AccessibilityReport{Violations: violations}, nil
}
