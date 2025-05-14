// Global variables
const codeEditor = document.getElementById('codeEditor');
const consoleOutput = document.getElementById('consoleOutput');
const htmlOutput = document.getElementById('htmlOutput');
const lineNumbers = document.getElementById('lineNumbers');
const tasksPanel = document.getElementById('tasksPanel');
const snippetMenu = document.getElementById('snippetMenu');
const outputContainer = document.querySelector('.output-container');
const languageSelect = document.getElementById('language');

let currentFile = 'main';
let files = {
    'main': { content: '', language: 'python' }
};
let showLineNumbers = false;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadLastCode();
    updateLineNumbers();
    
    // Event listeners
    codeEditor.addEventListener('keydown', handleTabKey);
    languageSelect.addEventListener('change', () => {
        files[currentFile].language = languageSelect.value;
        updateEditorTab();
    });
    
    // Hide line numbers on start
    lineNumbers.style.display = 'none';
});

// Code handling
function runCode() {
    const language = languageSelect.value;
    const code = codeEditor.value;
    
    // Save code in memory
    files[currentFile].content = code;
    localStorage.setItem('lastCode', code);
    localStorage.setItem('lastLanguage', language);
    
    // Clear console
    consoleOutput.innerHTML = '';
    htmlOutput.style.display = 'none';
    
    try {
        switch(language) {
            case 'python':
                executePython(code);
                break;
            case 'javascript':
                executeJavaScript(code);
                break;
            case 'html':
                executeHTML(code);
                break;
            case 'css':
                executeCSS(code);
                break;
        }
        
        // Show output container if collapsed
        if (outputContainer.classList.contains('collapsed')) {
            toggleOutput();
        }
    } catch (e) {
        addConsoleError(`Execution error: ${e.message}`);
    }
}

function executePython(code) {
    // Simulation of Python code execution
    addConsoleLog('Running Python code...');
    
    // Capture print()
    let printOutput = [];
    
    // Use regular expressions to capture print()
    const printRegex = /print\((["'](.+)["']|.+)\)/g;
    const matches = code.matchAll(printRegex);
    
    let found = false;
    for (const match of matches) {
        found = true;
        let content = match[1];
        // Remove quotes if present
        if (content.startsWith('"') || content.startsWith("'")) {
            content = content.slice(1, -1);
        }
        printOutput.push(content);
    }
    
    if (found) {
        printOutput.forEach(output => {
            addConsoleLog(output);
        });
    } else {
        addConsoleLog('Program executed. No output.');
    }
    
    addConsoleSuccess('Program completed successfully.');
}

function executeJavaScript(code) {
    // Execute JavaScript code
    addConsoleLog('Running JavaScript code...');
    
    // Capture console.log
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    try {
        console.log = (...args) => {
            addConsoleLog(args.join(' '));
        };
        console.error = (...args) => {
            addConsoleError(args.join(' '));
        };
        console.warn = (...args) => {
            addConsoleWarn(args.join(' '));
        };
        
        // Execute code in a function to avoid global errors
        (new Function(code))();
        addConsoleSuccess('Program completed successfully.');
    } catch (e) {
        addConsoleError(`JavaScript Error: ${e.message}`);
    } finally {
        // Restore original console.log
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
    }
}

function executeHTML(code) {
    // Execute HTML code
    consoleOutput.parentElement.style.display = 'none';
    htmlOutput.style.display = 'block';
    htmlOutput.srcdoc = code;
}

function executeCSS(code) {
    // For CSS code, show a sample HTML with the applied CSS
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
${code}
    </style>
</head>
<body>
    <h1>Sample Heading</h1>
    <p>This is sample text to demonstrate CSS.</p>
    <button>Button</button>
    <div class="container">
        <div class="box">Element 1</div>
        <div class="box">Element 2</div>
        <div class="box">Element 3</div>
    </div>
</body>
</html>`;
    
    consoleOutput.parentElement.style.display = 'none';
    htmlOutput.style.display = 'block';
    htmlOutput.srcdoc = htmlTemplate;
}

function saveCode() {
    const code = codeEditor.value;
    const language = languageSelect.value;
    
    // Save code in localStorage
    localStorage.setItem('lastCode', code);
    localStorage.setItem('lastLanguage', language);
    
    // Save code on server
    fetch('/coding/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: `Code-${new Date().toISOString().slice(0, 10)}`,
            language: language,
            code: code
        })
    })
    .then(response => {
        if (response.ok) {
            showStatus('Code saved successfully!', 'success');
            return response.json();
        } else {
            throw new Error('Error saving code');
        }
    })
    .catch(error => {
        showStatus(`Error: ${error.message}`, 'error');
    });
}

function clearCode() {
    if (confirm('Are you sure you want to clear the editor?')) {
        codeEditor.value = '';
        updateLineNumbers();
    }
}

function loadLastCode() {
    const lastCode = localStorage.getItem('lastCode');
    const lastLanguage = localStorage.getItem('lastLanguage');
    
    if (lastCode) {
        codeEditor.value = lastCode;
        files[currentFile].content = lastCode;
    }
    
    if (lastLanguage) {
        languageSelect.value = lastLanguage;
        files[currentFile].language = lastLanguage;
    }
    
    updateLineNumbers();
}

// Console output
function addConsoleLog(message) {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = message;
    consoleOutput.appendChild(line);
}

function addConsoleError(message) {
    const line = document.createElement('div');
    line.className = 'console-line console-error';
    line.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    consoleOutput.appendChild(line);
}

function addConsoleWarn(message) {
    const line = document.createElement('div');
    line.className = 'console-line console-warn';
    line.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    consoleOutput.appendChild(line);
}

function addConsoleSuccess(message) {
    const line = document.createElement('div');
    line.className = 'console-line console-success';
    line.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    consoleOutput.appendChild(line);
}

// UI functions
function toggleOutput() {
    outputContainer.classList.toggle('collapsed');
    const toggleBtn = document.querySelector('.output-header .toggle-btn');
    toggleBtn.classList.toggle('collapsed');
    
    if (outputContainer.classList.contains('collapsed')) {
        outputContainer.style.maxHeight = '40px';
    } else {
        outputContainer.style.maxHeight = '40%';
    }
}

function toggleTasksPanel() {
    tasksPanel.classList.toggle('show');
}

function toggleTask(element) {
    const taskCard = element.parentElement;
    const allTasks = document.querySelectorAll('.task-card');
    
    allTasks.forEach(task => {
        if (task !== taskCard) {
            task.classList.remove('active');
        }
    });
    
    taskCard.classList.toggle('active');
}

function toggleLineNumbers() {
    showLineNumbers = !showLineNumbers;
    
    if (showLineNumbers) {
        lineNumbers.style.display = 'block';
        codeEditor.classList.add('with-line-numbers');
    } else {
        lineNumbers.style.display = 'none';
        codeEditor.classList.remove('with-line-numbers');
    }
    
    updateLineNumbers();
}

function toggleSnippets() {
    snippetMenu.classList.toggle('show');
}

function updateLineNumbers() {
    if (!showLineNumbers) return;
    
    const lines = codeEditor.value.split('\n');
    let lineNumbersHTML = '';
    
    for (let i = 0; i < lines.length; i++) {
        lineNumbersHTML += `<div>${i + 1}</div>`;
    }
    
    lineNumbers.innerHTML = lineNumbersHTML;
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status-message ${type}`;
    status.classList.add('show');
    
    setTimeout(() => {
        status.classList.remove('show');
    }, 3000);
}

// Key handling
function handleTabKey(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        
        // Insert tab (4 spaces)
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        
        codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
        
        updateLineNumbers();
    }
}

// Editor functions
function formatCode() {
    const language = languageSelect.value;
    const code = codeEditor.value;
    
    // Simple code formatting
    let formattedCode = code;
    
    try {
        switch (language) {
            case 'html':
                formattedCode = formatHTML(code);
                break;
            case 'css':
                formattedCode = formatCSS(code);
                break;
            case 'javascript':
                formattedCode = formatJavaScript(code);
                break;
            case 'python':
                formattedCode = formatPython(code);
                break;
        }
        
        codeEditor.value = formattedCode;
        updateLineNumbers();
        showStatus('Code formatted', 'success');
    } catch (e) {
        showStatus('Error formatting code', 'error');
    }
}

function formatHTML(code) {
    // Simple HTML formatting
    let formatted = '';
    let indent = 0;
    const lines = code.split('\n');
    
    lines.forEach(line => {
        // Remove whitespace at beginning and end
        const trimmedLine = line.trim();
        
        // Skip empty lines without formatting
        if (trimmedLine === '') {
            formatted += '\n';
            return;
        }
        
        // Decrease indentation for closing tags
        if (trimmedLine.startsWith('</')) {
            indent -= 1;
        }
        
        // Add indentation
        const spaces = '    '.repeat(Math.max(0, indent));
        formatted += spaces + trimmedLine + '\n';
        
        // Increase indentation for opening tags (with exceptions)
        if (trimmedLine.startsWith('<') && 
            !trimmedLine.startsWith('</') &&
            !trimmedLine.endsWith('/>') &&
            !trimmedLine.includes('</') &&
            !trimmedLine.includes('<br')) {
            indent += 1;
        }
    });
    
    return formatted;
}

function formatCSS(code) {
    // Simple CSS formatting
    let formatted = '';
    let indent = 0;
    
    // Replace brackets { and } with added newlines
    code = code.replace(/\s*{\s*/g, ' {\n');
    code = code.replace(/\s*}\s*/g, '\n}\n');
    
    // Replace semicolons with added newlines
    code = code.replace(/;\s*/g, ';\n');
    
    const lines = code.split('\n');
    
    lines.forEach(line => {
        // Remove whitespace at beginning and end
        const trimmedLine = line.trim();
        
        // Skip empty lines without formatting
        if (trimmedLine === '') {
            return;
        }
        
        // Decrease indentation for closing brackets
        if (trimmedLine === '}') {
            indent -= 1;
        }
        
        // Add indentation
        const spaces = '    '.repeat(Math.max(0, indent));
        formatted += spaces + trimmedLine + '\n';
        
        // Increase indentation after opening bracket
        if (trimmedLine.includes('{')) {
            indent += 1;
        }
    });
    
    return formatted;
}

function formatJavaScript(code) {
    // Simple JavaScript formatting
    return formatCSS(code); // Similar rules as CSS
}

function formatPython(code) {
    // Python has its own formatting rules, here we leave as is
    return code;
}

// File management
function addNewTab() {
    const fileName = prompt('Enter file name:');
    
    if (fileName && fileName.trim() !== '') {
        // Add file extension depending on language
        const language = languageSelect.value;
        let fullFileName = fileName;
        
        if (!fileName.includes('.')) {
            switch (language) {
                case 'python':
                    fullFileName += '.py';
                    break;
                case 'javascript':
                    fullFileName += '.js';
                    break;
                case 'html':
                    fullFileName += '.html';
                    break;
                case 'css':
                    fullFileName += '.css';
                    break;
            }
        }
        
        // Save current file
        files[currentFile].content = codeEditor.value;
        
        // Create new file
        files[fullFileName] = { content: '', language: language };
        currentFile = fullFileName;
        
        // Add new tab
        const tabsContainer = document.querySelector('.editor-tabs');
        const newTab = document.createElement('div');
        newTab.className = 'editor-tab';
        newTab.textContent = fullFileName;
        newTab.dataset.file = fullFileName;
        newTab.onclick = function() { switchFile(fullFileName); };
        
        // Add before "New file"
        const newFileTab = document.querySelector('[data-file="new"]');
        tabsContainer.insertBefore(newTab, newFileTab);
        
        // Activate new tab
        switchFile(fullFileName);
    }
}

function switchFile(fileName) {
    // Save current file
    files[currentFile].content = codeEditor.value;
    
    // Change current file
    currentFile = fileName;
    codeEditor.value = files[fileName].content;
    
    // Set language
    if (files[fileName].language) {
        languageSelect.value = files[fileName].language;
    }
    
    // Update tabs
    updateEditorTab();
    updateLineNumbers();
}

function updateEditorTab() {
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => {
        if (tab.dataset.file === currentFile) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Code snippets
function insertSnippet(snippetType) {
    let snippet = '';
    
    switch (snippetType) {
        case 'python-function':
            snippet = 'def function_name(param1, param2):\n    """Documentation\n    \n    Args:\n        param1: Description\n        param2: Description\n    \n    Returns:\n        Description\n    """\n    # Function code here\n    result = param1 + param2\n    return result\n\n# Example of use\nresult = function_name(10, 20)\nprint(f"Result: {result}")';
            break;
        case 'python-class':
            snippet = 'class MyClass:\n    """Class documentation\n    \n    Attributes:\n        attribute1: Description\n    """\n    \n    def __init__(self, param1):\n        """Initialize the class\n        \n        Args:\n            param1: Description\n        """\n        self.attribute1 = param1\n    \n    def method_name(self, param1):\n        """Method documentation\n        \n        Args:\n            param1: Description\n        \n        Returns:\n            Description\n        """\n        return self.attribute1 + param1\n\n# Example of use\nmy_object = MyClass(10)\nresult = my_object.method_name(5)\nprint(f"Result: {result}")';
            break;
        case 'js-function':
            snippet = '/**\n * Function documentation\n * @param {type} param1 - Description\n * @param {type} param2 - Description\n * @returns {type} Description\n */\nfunction functionName(param1, param2) {\n    // Function code here\n    const result = param1 + param2;\n    return result;\n}\n\n// Example of use\nconst result = functionName(10, 20);\nconsole.log(`Result: ${result}`);';
            break;
        case 'html-template':
            snippet = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document Title</title>\n    <style>\n        /* CSS styles */\n        body {\n            font-family: Arial, sans-serif;\n            line-height: 1.6;\n            margin: 0;\n            padding: 20px;\n        }\n        \n        h1 {\n            color: #333;\n        }\n    </style>\n</head>\n<body>\n    <header>\n        <h1>Page Title</h1>\n        <nav>\n            <ul>\n                <li><a href="#">Home</a></li>\n                <li><a href="#">About</a></li>\n                <li><a href="#">Contact</a></li>\n            </ul>\n        </nav>\n    </header>\n    \n    <main>\n        <section>\n            <h2>Section Title</h2>\n            <p>This is a paragraph of text.</p>\n        </section>\n    </main>\n    \n    <footer>\n        <p>&copy; 2025 Your Name</p>\n    </footer>\n    \n    <script>\n        // JavaScript code\n        document.addEventListener(\'DOMContentLoaded\', function() {\n            console.log(\'Page loaded\');\n        });\n    </script>\n</body>\n</html>';
            break;
        case 'css-animation':
            snippet = '/* CSS Animation Example */\n\n/* Element to animate */\n.animated-element {\n    width: 100px;\n    height: 100px;\n    background-color: #3498db;\n    position: relative;\n    animation-name: moveAround;\n    animation-duration: 4s;\n    animation-iteration-count: infinite;\n    animation-timing-function: ease-in-out;\n}\n\n/* Define the animation */\n@keyframes moveAround {\n    0% {\n        left: 0;\n        top: 0;\n        background-color: #3498db;\n        transform: rotate(0deg);\n    }\n    25% {\n        left: 200px;\n        top: 0;\n        background-color: #2ecc71;\n        transform: rotate(90deg);\n    }\n    50% {\n        left: 200px;\n        top: 200px;\n        background-color: #f1c40f;\n        transform: rotate(180deg);\n    }\n    75% {\n        left: 0;\n        top: 200px;\n        background-color: #e74c3c;\n        transform: rotate(270deg);\n    }\n    100% {\n        left: 0;\n        top: 0;\n        background-color: #3498db;\n        transform: rotate(360deg);\n    }\n}';
            break;
    }
    
    if (snippet) {
        // Insert snippet at current cursor position
        const start = codeEditor.selectionStart;
        codeEditor.value = codeEditor.value.substring(0, start) + snippet + codeEditor.value.substring(start);
        updateLineNumbers();
        
        // Hide snippet menu
        snippetMenu.classList.remove('show');
    }
}

function loadExample(exampleType) {
    let code = '';

    switch (exampleType) {
        case 'python-hello':
            code = 'import datetime\n\nprint("Hello, World!")\ncurrent_date = datetime.datetime.now()\nprint(f"Today is: {current_date.strftime(\'%Y-%m-%d\')}")';
            languageSelect.value = 'python';
            break;
        case 'python-calculator':
            code = 'def calculator(a, b, operation):\n    if operation == \'+\':\n        return a + b\n    elif operation == \'-\':\n        return a - b\n    elif operation == \'*\':\n        return a * b\n    elif operation == \'/\':\n        if b == 0:\n            return "Error: Division by zero"\n        return a / b\n    else:\n        return "Unknown operation"\n\n# Examples of use\nprint(f"10 + 5 = {calculator(10, 5, \'+\')}")\nprint(f"10 - 5 = {calculator(10, 5, \'-\')}")\nprint(f"10 * 5 = {calculator(10, 5, \'*\')}")\nprint(f"10 / 5 = {calculator(10, 5, \'/\')}")\nprint(f"10 / 0 = {calculator(10, 0, \'/\')}")';
            languageSelect.value = 'python';
            break;
        case 'html-basic':
            code = '<!DOCTYPE html>\n<html>\n<head>\n    <title>JavaScript Example</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            height: 100vh;\n            margin: 0;\n        }\n        \n        button {\n            padding: 10px 20px;\n            font-size: 16px;\n            background-color: #4CAF50;\n            color: white;\n            border: none;\n            border-radius: 4px;\n            cursor: pointer;\n            transition: all 0.3s ease;\n        }\n        \n        button:hover {\n            background-color: #45a049;\n            transform: scale(1.05);\n        }\n    </style>\n</head>\n<body>\n    <button id="myButton">Click me!</button>\n    \n    <script>\n        document.getElementById(\'myButton\').addEventListener(\'click\', function() {\n            alert(\'Button was clicked!\');\n        });\n    </script>\n</body>\n</html>n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Welcome to my page!</h1>\n    <p>This is a simple HTML example.</p>\n    <img src="https://via.placeholder.com/150" alt="Placeholder">\n</body>\n</html>';
            languageSelect.value = 'html';
            break;
        case 'css-basic':
            code = 'body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    color: #666;\n    line-height: 1.6;\n}\n\nimg {\n    display: block;\n    margin: 20px auto;\n    border: 5px solid #333;\n    border-radius: 10px;\n}';
            languageSelect.value = 'css';
            break;
    }

    if (code) {
        codeEditor.value = code;
        updateLineNumbers();
        files[currentFile].content = code;
        files[currentFile].language = languageSelect.value;
    }
}