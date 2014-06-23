// TODO: How to make the dependencies explicit.
define(/*'main', ['require', 'exports', 'module'],*/ function(require, exports, module)
{
    var ace = require('ace/ace');
    var AceRange = require('ace/range').Range;
    var AutoComplete= require('scripts/AutoComplete').AutoComplete;
    var lang = require("ace/lib/lang");
    var EditorPosition = require('scripts/EditorPosition').EditorPosition;
    var CompilationService =  require('scripts/CompilationService').CompilationService;
    var FileService =  require('scripts/FileService').FileService;
    var deferredCall = require("ace/lib/lang").deferredCall;

    var pys = require('ace/mode/python/pythonServices');

    // Don't really need this here, but proove we can load it.
//  var davinciPy = require('vendor/davinci-py/dist/davinci-py');
    var davinciPy = require('davinciPy');

    var Services = pys.Services;

    // This customized object was cloned from harness.ts.
    // Although it is custom, it appears it has to be compatible with the shim below.
    // It must implement ILanguageServiceShimHost, ILogger, and functions addScript, updateScript, editScript.
    var harness = require('ace/mode/python/harness');
    var scriptManager =  new harness.ScriptManager();

    var aceEditorPosition = null;
    var appFileService = null;
    var editor = null;
    var outputEditor = null;
    var typeCompilationService = null;
    var docUpdateCount = 0;
    var ServicesFactory = new Services.ServicesFactory();
    var serviceShim = ServicesFactory.createLanguageServiceShim(scriptManager);

    var selectFileName = "";

    var syncStop = false; //for stop sync on loadfile
    var autoComplete = null;
    var refMarkers = [];
    var errorMarkers =[];

    function loadFile(filename) {
        appFileService.readFile(filename, function(content){
            selectFileName = filename;
            syncStop = true;
            var data= content.replace(/\r\n?/g,"\n");
            editor.setValue(data);
            editor.moveCursorTo(0, 0);
            scriptManager.updateScript(filename, editor.getSession().getDocument().getValue() , false);
            syncStop = false;
        });
    }

    function startAutoComplete(editor)
    {
        if (autoComplete.isActive() == false)
        {
            autoComplete.setScriptName(selectFileName);
            autoComplete.active();
        }
    }

    function onUpdateDocument(e)
    {
        if (selectFileName)
        {
            if (!syncStop)
            {
                try
                {
                    syncScriptServiceContent(selectFileName, e);
                    updateMarker(e);
                }
                catch(ex)
                {
                }
            }
        }
    }

// TODO check column
    function updateMarker(aceChangeEvent){
        var data = aceChangeEvent.data;
        var action = data.action;
        var range = data.range;
        var markers = editor.getSession().getMarkers(true);
        var line_count = 0;
        var isNewLine = editor.getSession().getDocument().isNewLine;

        if(action == "insertText"){
            if(isNewLine(data.text)){
                line_count = 1;
            }
        }else if(action == "insertLines"){
            line_count = data.lines.length;

        }else if (action == "removeText") {
            if(isNewLine(data.text)){
                line_count = -1;
            }

        }else if (action == "removeLines"){
            line_count = -data.lines.length;
        }

        if(line_count != 0){

            var markerUpdate = function(id){
                var marker = markers[id];
                var row = range.start.row;

                if(line_count > 0){
                    row = +1;
                }

                if(marker && marker.range.start.row > row ){
                    marker.range.start.row += line_count ;
                    marker.range.end.row += line_count ;
                }
            };

            errorMarkers.forEach(markerUpdate);
            refMarkers.forEach(markerUpdate);
            editor.onChangeFrontMarker();
        }

    }

//sync LanguageService content and ace editor content
    function syncScriptServiceContent(script, aceChangeEvent){

        var data = aceChangeEvent.data;
        var action = data.action;
        var range = data.range;
        var start = aceEditorPosition.getPositionChars(range.start);

        if(action == "insertText"){
            editLanguageService(script, new Services.TextEdit(start , start, data.text));
        }else if(action == "insertLines"){

            var text = data.lines.map(function(line) {
                return line+ '\n'; //TODO newline hard code
            }).join('');
            editLanguageService(script,new Services.TextEdit(start , start, text));

        }else if (action == "removeText") {
            var end = start + data.text.length;
            editLanguageService(script, new Services.TextEdit(start, end, ""));
        }else if (action == "removeLines"){
            var len = aceEditorPosition.getLinesChars(data.lines);
            var end = start + len;
            editLanguageService(script, new Services.TextEdit(start, end, ""));
        }
    };


    function editLanguageService(name, textEdit){
        scriptManager.editScript(name, textEdit.minChar, textEdit.limChar, textEdit.text);
    }

    function onChangeCursor(e){
        if(!syncStop){
            try{
                deferredShowOccurrences.schedule(200);
            }catch (ex){
                //TODO
            }
        }
    };

    function languageServiceIndent(){
        var cursor = editor.getCursorPosition();
        var lineNumber = cursor.row;

        var text  = editor.session.getLine(lineNumber);
        var matches = text.match(/^[\t ]*/);
        var preIndent = 0;
        var wordLen = 0;

        if(matches){
            wordLen = matches[0].length;
            for(var i = 0; i < matches[0].length; i++){
                var elm = matches[0].charAt(i);
                var spaceLen = (elm == " ") ? 1: editor.session.getTabSize();
                preIndent += spaceLen;
            };
        }

        var option = new Services.EditorOptions();
        option.NewLineCharacter = "\n";

        var smartIndent = serviceShim.languageService.getSmartIndentAtLineNumber(selectFileName, lineNumber, option);

        if(preIndent > smartIndent){
            editor.indent();
        }else{
            var indent = smartIndent - preIndent;

            if(indent > 0){
                editor.getSelection().moveCursorLineStart();
                editor.commands.exec("inserttext", editor, {text:" ", times:indent});
            }

            if( cursor.column > wordLen){
                cursor.column += indent;
            }else{
                cursor.column = indent + wordLen;
            }

            editor.getSelection().moveCursorToPosition(cursor);
        }
    }

    function refactor(){
        var references = serviceShim.languageService.getOccurrencesAtPosition(selectFileName, aceEditorPosition.getCurrentCharPosition());

        references.forEach(function(ref){
            var getpos = aceEditorPosition.getAcePositionFromChars;
            var start = getpos(ref.ast.minChar);
            var end = getpos(ref.ast.limChar);
            var range = new AceRange(start.row, start.column, end.row, end.column);
            editor.session.multiSelect.addRange(range);
        });
    }

    function showOccurrences()
    {
        var references = serviceShim.getLanguageService().getOccurrencesAtPosition(selectFileName, aceEditorPosition.getCurrentCharPosition());
        var session = editor.getSession();
        refMarkers.forEach(function (id)
        {
            session.removeMarker(id);
        });
        if (references)
        {
            references.forEach(function(ref)
            {
                //TODO check script name
                // console.log(ref.unitIndex);
                var getpos = aceEditorPosition.getAcePositionFromChars;
                var start = getpos(ref.ast.minChar);
                var end = getpos(ref.ast.limChar);
                var range = new AceRange(start.row, start.column, end.row, end.column);
                refMarkers.push(session.addMarker(range, "typescript-ref", "text", true));
            });
        }
    }

    var deferredShowOccurrences = deferredCall(showOccurrences);

    function workerOnCreate(func, timeout)
    {
        if(editor.getSession().$worker)
        {
            func(editor.getSession().$worker);
        }
        else
        {
            setTimeout(function(){
                workerOnCreate(func, timeout);
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

    $(function(){
        appFileService = new FileService($);
        editor = ace.edit("editor");
        editor.setTheme("ace/theme/twilight");
        editor.getSession().setMode('ace/mode/python');

        outputEditor = ace.edit("output");
        outputEditor.setTheme("ace/theme/twilight");
        outputEditor.getSession().setMode('ace/mode/javascript');
        document.getElementById('editor').style.fontSize='14px';
        document.getElementById('output').style.fontSize='14px';

        // TODO: Nice to make this data driven from the UI.
        loadFile("samples/eight.py");

        editor.addEventListener("change", onUpdateDocument);
        editor.addEventListener("changeSelection", onChangeCursor);

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

        aceEditorPosition = new EditorPosition(editor);
        typeCompilationService = new CompilationService(editor, serviceShim);
        autoComplete = new AutoComplete(editor, selectFileName, typeCompilationService);

        // override editor onTextInput
        var originalTextInput = editor.onTextInput;
        editor.onTextInput = function (text){
            originalTextInput.call(editor, text);
            if(text == "."){
                editor.commands.exec("autoComplete");

            }else if (editor.getSession().getDocument().isNewLine(text)) {
                var lineNumber = editor.getCursorPosition().row;
                var option = new Services.EditorOptions();
                option.NewLineCharacter = "\n";
                var indent = serviceShim.languageService.getSmartIndentAtLineNumber(selectFileName, lineNumber, option);
                if(indent > 0) {
                    editor.commands.exec("inserttext", editor, {text:" ", times:indent});
                }
            }
        };

        editor.addEventListener("mousedown", function(e){
            if(autoComplete.isActive()){
                autoComplete.deactivate();
            }
        });

        editor.getSession().on("compiled", function(e){
            outputEditor.getSession().doc.setValue(e.data);
        });

        editor.getSession().on("compileErrors", function(e){
            var session = editor.getSession();
            errorMarkers.forEach(function (id){
                session.removeMarker(id);
            });
            e.data.forEach(function(error){
                var getpos = aceEditorPosition.getAcePositionFromChars;
                var start = getpos(error.minChar);
                var end = getpos(error.limChar);
                var range = new AceRange(start.row, start.column, end.row, end.column);
                errorMarkers.push(session.addMarker(range, "typescript-error", "text", true));
            });
        });

        workerOnCreate(function() {

        }, 100);

        $("#javascript-run").click(function(e){
            javascriptRun();
        });

        $("#select-sample").change(function(e){
            var path = "samples/" + $(this).val();
            loadFile(path);
        });

    });
});





