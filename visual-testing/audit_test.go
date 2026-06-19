package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAccessibilityAudit(t *testing.T) {
	// Start a mock server serving HTML with intentional accessibility issues:
	// - Missing alt attribute on <img>
	// - Insufficient color contrast placeholder
	// - Tabbable element without an accessible role or name
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		io.WriteString(w, `
			<!DOCTYPE html>
			<html>
			<head>
				<title>A11y Test Page</title>
			</head>
			<body>
				<h1>Accessibility Audit Test</h1>
				<!-- Violation: missing alt tag -->
				<img src="logo.png" id="bad-image">
				
				<!-- Violation: low contrast placeholder -->
				<div style="background-color: #ffffff; color: #f5f5f5;" id="low-contrast-text">
					Super light text on white background.
				</div>

				<!-- Violation: click element with no role/aria-label -->
				<div onclick="doSomething()" tabindex="0" id="bad-interactive">Clickable Div</div>
			</body>
			</html>
		`)
	}))
	defer server.Close()

	// Run accessibility audit
	report, err := RunAccessibilityAudit(server.URL)
	if err != nil {
		t.Fatalf("RunAccessibilityAudit failed: %v", err)
	}

	// Verify we caught violations
	if len(report.Violations) == 0 {
		t.Errorf("expected to detect accessibility violations, got 0")
	}

	// Verify we caught the missing alt attribute violation
	foundAltViolation := false
	for _, v := range report.Violations {
		if v.ID == "image-alt" || v.ID == "missing-alt" || v.Selector == "img#bad-image" || v.Selector == "#bad-image" {
			foundAltViolation = true
		}
	}
	if !foundAltViolation {
		t.Errorf("expected to find missing-alt violation on image")
	}

	// Verify we caught the bad interactive element tab-index violation
	foundTabViolation := false
	for _, v := range report.Violations {
		if v.ID == "missing-role" || v.ID == "scrollable-region-focusable" || v.ID == "aria-allowed-role" || v.ID == "aria-roles" || v.Selector == "div#bad-interactive" || v.Selector == "#bad-interactive" {
			foundTabViolation = true
		}
	}
	if !foundTabViolation {
		t.Errorf("expected to find missing-role/aria violation on interactive div")
	}
}
