package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "snapshot":
		snapshotCmd := flag.NewFlagSet("snapshot", flag.ExitOnError)
		urlFlag := snapshotCmd.String("url", "", "Target URL to capture")
		outputFlag := snapshotCmd.String("output", "", "Output directory for evidence")

		if err := snapshotCmd.Parse(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing flags: %v\n", err)
			os.Exit(1)
		}

		if *urlFlag == "" || *outputFlag == "" {
			fmt.Fprintf(os.Stderr, "Error: --url and --output flags are required for snapshot command.\n")
			snapshotCmd.PrintDefaults()
			os.Exit(1)
		}

		err := CaptureSnapshot(*urlFlag, *outputFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Snapshot execution failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Snapshot completed successfully!")

	case "diff":
		diffCmd := flag.NewFlagSet("diff", flag.ExitOnError)
		beforeFlag := diffCmd.String("before", "", "Before evidence directory")
		afterFlag := diffCmd.String("after", "", "After evidence directory")
		outputFlag := diffCmd.String("output", "", "Output directory for diff report")

		if err := diffCmd.Parse(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing flags: %v\n", err)
			os.Exit(1)
		}

		if *beforeFlag == "" || *afterFlag == "" {
			fmt.Fprintf(os.Stderr, "Error: --before and --after flags are required for diff command.\n")
			diffCmd.PrintDefaults()
			os.Exit(1)
		}

		report, err := CompareDiffs(*beforeFlag, *afterFlag, *outputFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Diff comparison failed: %v\n", err)
			os.Exit(1)
		}

		// Print brief summary to stdout
		fmt.Printf("Diff comparison finished. Changes detected: %t\n", report.HasChanges)
		fmt.Printf("Added: %d, Removed: %d, Modified: %d, Layout Shifts: %d\n",
			len(report.Added), len(report.Removed), len(report.Modified), len(report.LayoutShifts))

	case "audit":
		auditCmd := flag.NewFlagSet("audit", flag.ExitOnError)
		urlFlag := auditCmd.String("url", "", "Target URL to run accessibility audit on")

		if err := auditCmd.Parse(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing flags: %v\n", err)
			os.Exit(1)
		}

		if *urlFlag == "" {
			fmt.Fprintf(os.Stderr, "Error: --url flag is required for audit command.\n")
			auditCmd.PrintDefaults()
			os.Exit(1)
		}

		report, err := RunAccessibilityAudit(*urlFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Accessibility audit failed: %v\n", err)
			os.Exit(1)
		}

		// Output JSON to stdout
		reportBytes, err := json.MarshalIndent(report, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to marshal audit report: %v\n", err)
			os.Exit(1)
		}
		fmt.Println(string(reportBytes))

	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("Veyra Go Playwright Visual Verification Tool")
	fmt.Println("Usage:")
	fmt.Println("  visual-testing <command> [arguments]")
	fmt.Println()
	fmt.Println("Commands:")
	fmt.Println("  snapshot --url <url> --output <dir>")
	fmt.Println("  diff     --before <dir> --after <dir> [--output <dir>]")
	fmt.Println("  audit    --url <url>")
}
