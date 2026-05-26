package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestSnapshot(t *testing.T) {
	// Start a mock server to capture screenshots of
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		io.WriteString(w, `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Test Page</title>
				<style>
					body { font-family: sans-serif; background-color: #f0f0f0; }
					.card { background: white; padding: 20px; border-radius: 8px; margin: 20px; }
				</style>
			</head>
			<body>
				<div class="card" id="main-card">
					<h1 id="heading">Hello World</h1>
					<p class="description">This is a test page for Go Playwright.</p>
				</div>
			</body>
			</html>
		`)
	}))
	defer server.Close()

	// Temp directory for outputs
	tmpDir, err := os.MkdirTemp("", "veyra-snapshot-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Run snapshot capture
	err = CaptureSnapshot(server.URL, tmpDir)
	if err != nil {
		t.Fatalf("CaptureSnapshot failed: %v", err)
	}

	// Verify viewports screenshots
	viewports := []string{"mobile", "tablet", "desktop"}
	for _, vp := range viewports {
		shotPath := filepath.Join(tmpDir, "viewport_"+vp+".png")
		if _, err := os.Stat(shotPath); os.IsNotExist(err) {
			t.Errorf("expected screenshot file %s to exist", shotPath)
		}
	}

	// Verify dom_structure.json
	domPath := filepath.Join(tmpDir, "dom_structure.json")
	if _, err := os.Stat(domPath); os.IsNotExist(err) {
		t.Fatalf("expected dom_structure.json to exist")
	}

	domData, err := os.ReadFile(domPath)
	if err != nil {
		t.Fatalf("failed to read dom_structure.json: %v", err)
	}

	var elements []DOMElement
	if err := json.Unmarshal(domData, &elements); err != nil {
		t.Fatalf("failed to parse dom_structure.json: %v", err)
	}

	// We expect at least the heading or main-card to be in the captured elements
	foundCard := false
	foundHeading := false
	for _, el := range elements {
		if el.ID == "main-card" && el.TagName == "DIV" {
			foundCard = true
		}
		if el.ID == "heading" && el.TagName == "H1" {
			foundHeading = true
		}
	}

	if !foundCard {
		t.Errorf("expected to find element with ID 'main-card' in captured DOM structure")
	}
	if !foundHeading {
		t.Errorf("expected to find element with ID 'heading' in captured DOM structure")
	}
}
