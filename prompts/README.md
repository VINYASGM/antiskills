How the prompt system works:
- Prompt Inheritance: base -> role -> task
- Dynamic Context: @import syntax pulls in only needed files
- Context Budget: instructions count against token window even with imports
- Negative Prompting: explicit constraints ("Do NOT...") over positive affirmations