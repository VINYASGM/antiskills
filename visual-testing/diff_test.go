package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestDiff(t *testing.T) {
	// Create mock "before" and "after" directories
	tmpBefore, err := os.MkdirTemp("", "veyra-diff-before-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpBefore)

	tmpAfter, err := os.MkdirTemp("", "veyra-diff-after-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpAfter)

	tmpOutput, err := os.MkdirTemp("", "veyra-diff-output-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpOutput)

	// Set up "before" DOM structure
	beforeDOM := []DOMElement{
		{ID: "heading", TagName: "H1", Text: "Hello World", X: 10, Y: 10, Width: 100, Height: 50},
		{ID: "desc", TagName: "P", Text: "Original description", X: 10, Y: 70, Width: 200, Height: 30},
	}
	beforeDOMBytes, _ := json.Marshal(beforeDOM)
	os.WriteFile(filepath.Join(tmpBefore, "dom_structure.json"), beforeDOMBytes, 0644)

	// Set up "after" DOM structure with changes:
	// - "desc" text and size changed (text modification)
	// - "new-btn" added
	// - "heading" moved slightly (layout shift)
	afterDOM := []DOMElement{
		{ID: "heading", TagName: "H1", Text: "Hello World", X: 15, Y: 10, Width: 100, Height: 50},
		{ID: "desc", TagName: "P", Text: "Modified description", X: 10, Y: 70, Width: 220, Height: 35},
		{ID: "new-btn", TagName: "BUTTON", Text: "Click me", X: 10, Y: 110, Width: 80, Height: 30},
	}
	afterDOMBytes, _ := json.Marshal(afterDOM)
	os.WriteFile(filepath.Join(tmpAfter, "dom_structure.json"), afterDOMBytes, 0644)

	// Run comparison
	report, err := CompareDiffs(tmpBefore, tmpAfter, tmpOutput)
	if err != nil {
		t.Fatalf("CompareDiffs failed: %v", err)
	}

	// Verify report contents
	if !report.HasChanges {
		t.Errorf("expected report to indicate changes")
	}

	// Verify added element
	foundAdded := false
	for _, add := range report.Added {
		if add.ID == "new-btn" {
			foundAdded = true
		}
	}
	if !foundAdded {
		t.Errorf("expected 'new-btn' to be detected as added element")
	}

	// Verify moved element
	foundMoved := false
	for _, shift := range report.LayoutShifts {
		if shift.ID == "heading" {
			foundMoved = true
		}
	}
	if !foundMoved {
		t.Errorf("expected 'heading' to be detected in layout shifts due to X change")
	}

	// Verify text modifications
	foundModified := false
	for _, mod := range report.Modified {
		if mod.ID == "desc" {
			foundModified = true
		}
	}
	if !foundModified {
		t.Errorf("expected 'desc' to be detected as modified element due to text change")
	}
}
