define(function(require, exports, module)
{
    var ace = require('ace/ace');
    var AceRange = require('ace/range').Range;
    var AutoComplete= require('scripts/AutoComplete').AutoComplete;
    var lang = require("ace/lib/lang");
    var EditorPosition = require('scripts/EditorPosition').EditorPosition;
    var CompletionService =  require('scripts/CompletionService').CompletionService;
    var FileService =  require('scripts/FileService').FileService;
    var deferredCall = require("ace/lib/lang").deferredCall;

    var tsLib = require('ace/mode/typescript/typescriptServices').TypeScript;
    var TypeScript = tsLib;
    var Services = tsLib.Services;
    var TextEdit = Services.TextEdit;
    var TypeScriptServicesFactory = Services.TypeScriptServicesFactory;
    var LanguageServiceHost = require('ace/mode/typescript/LanguageServiceHost').LanguageServiceHost;

    var lsHost =  new LanguageServiceHost();

    var editorPositionService = null;
    var appFileService = null;
    var editor = null;
    var outputEditor = null;
    var completionService = null;
    var docUpdateCount = 0;
    var languageService = new TypeScriptServicesFactory().createPullLanguageService(lsHost);

    var currentFileName = null;

    var syncStop = false; //for stop sync on loadfile
    var autoComplete = null;
    var refMarkers = [];
    var errorMarkers =[];

    // This stuff seems to provide the code assist.
    function loadTypeScriptLibrary()
    {
        var libnames =
        [
            "../../../vendor/davinci-blade/dist/davinci-blade.d.ts",
            "../../../vendor/davinci-eight/dist/davinci-eight.d.ts",
            "typescripts/lib.d.ts",
            "typescripts/ace.d.ts",
            "typescripts/eagle.d.ts",
            "typescripts/zoo.d.ts"
        ];

        libnames.forEach(function(fileName)
        {
            appFileService.readFile(fileName, function(content)
            {
                lsHost.addScript(fileName, content.replace(/\r\n?/g, '\n'), true);
            });
        });
    }

    function changeCurrentFile(fileName)
    {
        appFileService.readFile(fileName, function(content)
        {
            if (currentFileName)
            {
                lsHost.removeScript(currentFileName);
                currentFileName = null;
            }
            currentFileName = fileName;
            syncStop = true;
            var data = content.replace(/\r\n?/g, '\n');
            editor.setValue(data);
            editor.moveCursorTo(0, 0);
            lsHost.updateScript(fileName, editor.getSession().getDocument().getValue());
            syncStop = false;
        });
    }

    function startAutoComplete(editor)
    {
        if (autoComplete.isActive() == false)
        {
            autoComplete.setScriptName(currentFileName);
            autoComplete.active();
        }
    }

    function languageServiceIndent()
    {
        var cursor = editor.getCursorPosition();
        var lineNumber = cursor.row;

        var text  = editor.session.getLine(lineNumber);
        var matches = text.match(/^[\t ]*/);
        var preIndent = 0;
        var wordLen = 0;

        if(matches)
        {
            wordLen = matches[0].length;
            for(var i = 0; i < matches[0].length; i++){
                var elm = matches[0].charAt(i);
                var spaceLen = (elm == " ") ? 1: editor.session.getTabSize();
                preIndent += spaceLen;
            };
        }

        var option = new Services.EditorOptions();
        option.NewLineCharacter = "\n";

        var smartIndent = languageService.getSmartIndentAtLineNumber(currentFileName, lineNumber, option);

        if (preIndent > smartIndent)
        {
            editor.indent();
        }
        else
        {
            var indent = smartIndent - preIndent;

            if (indent > 0)
            {
                editor.getSelection().moveCursorLineStart();
                editor.commands.exec("inserttext", editor, {text:" ", times:indent});
            }

            if (cursor.column > wordLen)
            {
                cursor.column += indent;
            }
            else
            {
                cursor.column = indent + wordLen;
            }

            editor.getSelection().moveCursorToPosition(cursor);
        }
    }

    function refactor()
    {
        var references = languageService.getOccurrencesAtPosition(currentFileName, editorPositionService.getCurrentCharPosition());

        references.forEach(function(reference)
        {
            var getpos = editorPositionService.getPositionFromChars;
            var start = getpos(reference.minChar);
            var end = getpos(reference.limChar);
            var range = new AceRange(start.row, start.column, end.row, end.column);
            editor.session.multiSelect.addRange(range);
        });
    }

    function showOccurrences()
    {
        // We avoid the following problem using the hack in LanguageServiceHost.
        /*
        Uncaught Error: Not yet implemented. typescriptServices.js:1267
        Errors.notYetImplemented typescriptServices.js:1267
        StringScriptSnapshot.getTextChangeRangeSinceVersion typescriptServices.js:4138
        HostCache.getScriptTextChangeRangeSinceVersion typescriptServices.js:64510
        LanguageServiceCompiler.tryUpdateFile typescriptServices.js:64675
        LanguageServiceCompiler.synchronizeHostDataWorker typescriptServices.js:64657
        (anonymous function) typescriptServices.js:64627
        timeFunction typescriptServices.js:27531
        LanguageServiceCompiler.synchronizeHostData typescriptServices.js:64626
        LanguageServiceCompiler.getDocument typescriptServices.js:64717
        LanguageService.getSymbolInfoAtPosition typescriptServices.js:65423
        LanguageService.getOccurrencesAtPosition typescriptServices.js:65510
        showOccurrences main.js:150
        callback
        */

        var session = editor.getSession();
        refMarkers.forEach(function (id)
        {
            session.removeMarker(id);
        });
        try
        {
            var references = languageService.getOccurrencesAtPosition(currentFileName, editorPositionService.getCurrentCharPosition());
            if (references)
            {
                references.forEach(function(reference)
                {
                    var getpos = editorPositionService.getPositionFromChars;
                    var start = getpos(reference.minChar);
                    var end = getpos(reference.limChar);
                    var range = new AceRange(start.row, start.column, end.row, end.column);
                    refMarkers.push(session.addMarker(range, "typescript-ref", "text", true));
                });
            }
        }
        catch(e)
        {
            console.log("" + e);
        }
    }

    var deferredShowOccurrences = deferredCall(showOccurrences);

    // FIXME: We don't have to do this.
    // The worker can send events during its lifecycle and we can respond.
    function workerOnCreate(callback, timeout)
    {
        if(editor.getSession().$worker)
        {
            callback(editor.getSession().$worker);
        }
        else
        {
            setTimeout(function()
            {
                workerOnCreate(callback, timeout);
            });
        }
    }

    function javascriptRun()
    {
        eval(outputEditor.getSession().doc.getValue());
/*
        var external = window.open();
        var script = external.window.document.createElement("script");
        script.textContent = outputEditor.getSession().doc.getValue();
        external.window.document.body.appendChild(script);
*/
    }

    $(function()
    {
        appFileService = new FileService($);
        editor = ace.edit("editor");
//      editor.setTheme("ace/theme/twilight");
        editor.getSession().setMode('ace/mode/typescript');

        outputEditor = ace.edit("output");
//      outputEditor.setTheme("ace/theme/twilight");
        outputEditor.getSession().setMode('ace/mode/javascript');
        document.getElementById('editor').style.fontSize='14px';
        document.getElementById('output').style.fontSize='14px';

        loadTypeScriptLibrary();

        // TODO: Nice to make this data driven from the UI.
        changeCurrentFile("samples/davinci-eight.ts");

        /**
         * When the text in the editor changes, the edit is applied to the local language service.
         *
         * The onUpdate method of the worker is soon triggered followed by the compile method.
         */
        editor.addEventListener("change", function(event)
        {
//          console.log('editor.change(' + JSON.stringify(event) + ')');
            /**
             * Updates the script models.
             */
            function updateScriptModels(fileName)
            {
                function editLanguageServiceScript(textEdit)
                {
                    lsHost.editScript(fileName, textEdit.minChar, textEdit.limChar, textEdit.text);
                }
                var data = event.data;
                var action = data.action;
                var range = data.range;
                var start = editorPositionService.getPositionChars(range.start);

                if (action == "insertText")
                {
                    editLanguageServiceScript(new TextEdit(start , start, data.text));
                }
                else if (action == "insertLines")
                {
                    var text = data.lines.map(function(line) {return line + '\n';}).join('');
                    editLanguageServiceScript(new TextEdit(start , start, text));
                }
                else if (action == "removeText")
                {
                    var end = start + data.text.length;
                    editLanguageServiceScript(new TextEdit(start, end, ""));
                }
                else if (action == "removeLines")
                {
                    var len = editorPositionService.getLinesChars(data.lines);
                    var end = start + len;
                    editLanguageServiceScript(new TextEdit(start, end, ""));
                }
            };
            /**
             * Updates the maerker models.
             */
            function updateMarkerModels()
            {
                var data = event.data;
                var action = data.action;
                var range = data.range;
                var markers = editor.getSession().getMarkers(true);
                var line_count = 0;
                var isNewLine = editor.getSession().getDocument().isNewLine;

                if (action === "insertText")
                {
                    if(isNewLine(data.text))
                    {
                        line_count = 1;
                    }
                }
                else if (action === "insertLines")
                {
                    line_count = data.lines.length;
                }
                else if (action === "removeText")
                {
                    if(isNewLine(data.text))
                    {
                        line_count = -1;
                    }
                }
                else if (action === "removeLines")
                {
                    line_count = -data.lines.length;
                }

                if (line_count != 0)
                {
                    var markerUpdate = function(id)
                    {
                        var marker = markers[id];
                        var row = range.start.row;

                        if(line_count > 0)
                        {
                            row = +1;
                        }

                        if(marker && marker.range.start.row > row )
                        {
                            marker.range.start.row += line_count ;
                            marker.range.end.row += line_count ;
                        }
                    };

                    errorMarkers.forEach(markerUpdate);
                    refMarkers.forEach(markerUpdate);
                    // FIXME: This is the odd man out.
                    // We should not be triggering a view refresh here?
                    editor.onChangeFrontMarker();
                }
            }
            if (currentFileName)
            {
                if (!syncStop)
                {
                    try
                    {
                        updateScriptModels(currentFileName);
                        updateMarkerModels();
                    }
                    catch(e)
                    {
                        console.log("exception updating models: " + e)
                    }
                }
            }
        });

        /**
         * Changing the selection does not trigger any effort on behalf of the worker.
         */
        editor.addEventListener("changeSelection", function(event)
        {
            // There's not much in the event, just a 'type' property that is 'changeSelection'.
//          console.log('editor.changeSelection(' + JSON.stringify(event) + ')');
            if(!syncStop)
            {
                try
                {
                    deferredShowOccurrences.schedule(200);
                }
                catch (ex)
                {
                    //TODO
                }
            }
        });

        /**
         * This event seems to be pretty rare.
         */
        editor.addEventListener("changeCursor", function(event)
        {
            console.log('editor.changeCursor(' + JSON.stringify(event) + ')');
        });

        editor.commands.addCommands([{
            name:"autoComplete",
            bindKey:"Ctrl-Space",
            exec:function(editor) {
                startAutoComplete(editor);
            }
        }]);

        editor.commands.addCommands([{
            name:"refactor",
            bindKey: "F2",
            exec:function(editor) {
                refactor();
            }
        }]);

        editor.commands.addCommands([{
            name: "indent",
            bindKey: "Tab",
            exec: function(editor) {
                languageServiceIndent();
            },
            multiSelectAction: "forEach"
        }]);

        editorPositionService = new EditorPosition(editor);
        completionService = new CompletionService(editor, languageService);
        autoComplete = new AutoComplete(editor, currentFileName, completionService);

        // override editor onTextInput
        var originalTextInput = editor.onTextInput;
        editor.onTextInput = function (text)
        {
            originalTextInput.call(editor, text);
            if (text == ".")
            {
                editor.commands.exec("autoComplete");
            }
            else if (editor.getSession().getDocument().isNewLine(text))
            {
                var lineNumber = editor.getCursorPosition().row;
                var option = new Services.EditorOptions();
                option.NewLineCharacter = "\n";
                // FIXME: Smart Indenting
                /*
                var indent = languageService.getSmartIndentAtLineNumber(currentFileName, lineNumber, option);
                if(indent > 0)
                {
                    editor.commands.exec("inserttext", editor, {text:" ", times:indent});
                }
                */
            }
        };

        editor.addEventListener("mousedown", function(event)
        {
            if(autoComplete.isActive())
            {
                autoComplete.deactivate();
            }
        });

        editor.getSession().on("compiled", function(event)
        {
            outputEditor.getSession().doc.setValue(event.data.text);
        });

        editor.getSession().on("compileErrors", function(event)
        {
//          console.log("editorSession.compileErrors(" + JSON.stringify(event) + ")");

            var session = editor.getSession();

            // Remove the existing error markers from the editor session.
            // TODO: Why don't we clear the model (errorMarkers).
            errorMarkers.forEach(function (id) {session.removeMarker(id);});

            // Add the new compile errors to the editor session and the id(s) to the model.
            event.data.forEach(function(error)
            {
                var getpos = editorPositionService.getPositionFromChars;
                var start = getpos(error.minChar);
                var end = getpos(error.limChar);
                var range = new AceRange(start.row, start.column, end.row, end.column);
                // Add a new marker to the given Range. The last argument (inFront) causes a
                // front marker to be defined and the 'changeFrontMarker' event fires.
                // The class parameter is a css stylesheet class so you must have it in your CSS.
                // TODO: Remembering all these parameters is a nightmare. A fluent interface
                // might help.
                // var markerId = addMarker("typescript-error").toRange(range).ofType("text").inFront().getMarkerId();
                errorMarkers.push(session.addMarker(range, "typescript-error", "text", true));
            });
            session.setAnnotations(event.data);
        });

        workerOnCreate(function(worker)
        {
            [
                "../../../vendor/davinci-blade/dist/davinci-blade.d.ts",
                "../../../vendor/davinci-eight/dist/davinci-eight.d.ts",
                "typescripts/stats.js.d.ts",
                "typescripts/lib.d.ts",
                "typescripts/ace.d.ts",
                "typescripts/zoo.d.ts",
                "typescripts/eagle.d.ts"
            ].forEach(function(fileName)
            {
                // The FileService makes XML HTTP requests to retrieve the content.
                appFileService.readFile(fileName, function(content)
                {
                    var params =
                    {
                        data: {'fileName': fileName, 'content': content.replace(/\r\n?/g, '\n')}
                    };
                    worker.emit("addLibrary", params);
                });
            });
        }, 100);

        $("#javascript-run").click(function(e)
        {
            javascriptRun();
        });

        $("#select-sample").change(function(e)
        {
            var path = "" + $(this).val();
            changeCurrentFile(path);
        });

    });
});





