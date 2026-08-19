try { eval(new ActiveXObject('Scripting.FileSystemObject').OpenTextFile('script.js', 1).ReadAll()); WScript.Echo('Valid'); } catch(e) { WScript.Echo('Error: ' + e.message + ' at line ' + e.line); }
