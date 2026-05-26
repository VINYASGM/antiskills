package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
)

type LayoutShift struct {
	ID            string  `json:"id"`
	TagName       string  `json:"tagName"`
	BeforeX       float64 `json:"beforeX"`
	BeforeY       float64 `json:"beforeY"`
	AfterX        float64 `json:"afterX"`
	AfterY        float64 `json:"afterY"`
	ShiftDistance float64 `json:"shiftDistance"`
}

type DiffReport struct {
	HasChanges   bool          `json:"hasChanges"`
	Added        []DOMElement  `json:"added"`
	Removed      []DOMElement  `json:"removed"`
	Modified     []DOMElement  `json:"modified"`
	LayoutShifts []LayoutShift `json:"layoutShifts"`
}

func CompareDiffs(beforeDir string, afterDir string, outputDir string) (*DiffReport, error) {
	// Load before DOM
	beforePath := filepath.Join(beforeDir, "dom_structure.json")
	var beforeElements []DOMElement
	if _, err := os.Stat(beforePath); err == nil {
		beforeBytes, err := os.ReadFile(beforePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read before dom_structure.json: %w", err)
		}
		if err := json.Unmarshal(beforeBytes, &beforeElements); err != nil {
			return nil, fmt.Errorf("failed to parse before dom_structure.json: %w", err)
		}
	}

	// Load after DOM
	afterPath := filepath.Join(afterDir, "dom_structure.json")
	var afterElements []DOMElement
	if _, err := os.Stat(afterPath); err == nil {
		afterBytes, err := os.ReadFile(afterPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read after dom_structure.json: %w", err)
		}
		if err := json.Unmarshal(afterBytes, &afterElements); err != nil {
			return nil, fmt.Errorf("failed to parse after dom_structure.json: %w", err)
		}
	}

	report := &DiffReport{
		HasChanges:   false,
		Added:        []DOMElement{},
		Removed:      []DOMElement{},
		Modified:     []DOMElement{},
		LayoutShifts: []LayoutShift{},
	}

	// Index before elements by ID or position if ID is empty
	beforeByID := make(map[string]DOMElement)
	for _, el := range beforeElements {
		if el.ID != "" {
			beforeByID[el.ID] = el
		}
	}

	// Index after elements by ID
	afterByID := make(map[string]DOMElement)
	for _, el := range afterElements {
		if el.ID != "" {
			afterByID[el.ID] = el
		}
	}

	// 1. Detect Added and Modified Elements
	for _, afterEl := range afterElements {
		if afterEl.ID == "" {
			// Skip elements without ID for strict structural testing
			continue
		}

		beforeEl, exists := beforeByID[afterEl.ID]
		if !exists {
			report.Added = append(report.Added, afterEl)
			report.HasChanges = true
			continue
		}

		// Check for layout shift (position changed)
		dx := afterEl.X - beforeEl.X
		dy := afterEl.Y - beforeEl.Y
		dist := math.Sqrt(dx*dx + dy*dy)
		if dist > 2.0 { // threshold of 2 pixels
			report.LayoutShifts = append(report.LayoutShifts, LayoutShift{
				ID:            afterEl.ID,
				TagName:       afterEl.TagName,
				BeforeX:       beforeEl.X,
				BeforeY:       beforeEl.Y,
				AfterX:        afterEl.X,
				AfterY:        afterEl.Y,
				ShiftDistance: dist,
			})
			report.HasChanges = true
		}

		// Check for textual or size modifications
		if afterEl.Text != beforeEl.Text || afterEl.Width != beforeEl.Width || afterEl.Height != beforeEl.Height {
			report.Modified = append(report.Modified, afterEl)
			report.HasChanges = true
		}
	}

	// 2. Detect Removed Elements
	for _, beforeEl := range beforeElements {
		if beforeEl.ID == "" {
			continue
		}
		if _, exists := afterByID[beforeEl.ID]; !exists {
			report.Removed = append(report.Removed, beforeEl)
			report.HasChanges = true
		}
	}

	// Write report to output directory if specified
	if outputDir != "" {
		if err := os.MkdirAll(outputDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create output directory: %w", err)
		}
		reportPath := filepath.Join(outputDir, "diff_report.json")
		reportBytes, err := json.MarshalIndent(report, "", "  ")
		if err != nil {
			return nil, fmt.Errorf("failed to serialize diff report: %w", err)
		}
		if err := os.WriteFile(reportPath, reportBytes, 0644); err != nil {
			return nil, fmt.Errorf("failed to write diff report: %w", err)
		}
	}

	return report, nil
}
