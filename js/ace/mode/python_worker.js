define(function(require, exports, module) {
    "no use strict";

    var oop = require("../lib/oop");
    var Mirror = require("../worker/mirror").Mirror;
    var lang = require("../lib/lang");
    var Document = require("../document").Document;
    var DocumentPositionUtil = require('./python/DocumentPositionUtil').DocumentPositionUtil;

    var ScriptManager = require('./python/harness').ScriptManager;
    var davinciPy = require('./python/davinci-py');

    var PythonWorker = exports.PythonWorker = function(sender)
    {
        this.sender = sender;
        var doc = this.doc = new Document("");

        var deferredUpdate = this.deferredUpdate = lang.deferredCall(this.onUpdate.bind(this));

        this.scriptManager =  new ScriptManager();

        var self = this;
        sender.on("change", function(e) {
            doc.applyDeltas(e.data);
            deferredUpdate.schedule(self.$timeout);
        });

        sender.on("addLibrary", function(e) {
            self.addlibrary(e.data.name , e.data.content);
        });

        this.setOptions();
        sender.emit("initAfter");
    };

    oop.inherits(PythonWorker, Mirror);

    (function() {
        var proto = this;
        this.setOptions = function(options)
        {
            console.log('worker.setOptions(' + JSON.stringify(options) + ')');
            this.options = options || {};
        };

        this.changeOptions = function(newOptions)
        {
            console.log("worker.changeOptions");
            oop.mixin(this.options, newOptions);
            this.deferredUpdate.schedule(100);
        };

        this.addlibrary = function(name, content)
        {
            console.log('worker.addLibrary(' + name + ')');
//          this.scriptManager.addScript(name, content.replace(/\r\n?/g,"\n"), true);
        };



        this.getCompletionsAtPosition = function(fileName, pos, isMemberCompletion, id)
        {
            console.log("worker.getCompletionsAtPosition");
            /*
            var ret = this.languageService.getCompletionsAtPosition(fileName, pos, isMemberCompletion);
            this.sender.callback(ret, id);
            */
        };

        ["getTypeAtPosition",
            "getSignatureAtPosition",
            "getDefinitionAtPosition"].forEach(function(elm){
                proto[elm] = function(fileName, pos,  id) {
                    var ret = this.languageService[elm](fileName, pos);
                    this.sender.callback(ret, id);
                };
            });

        ["getReferencesAtPosition",
            "getOccurrencesAtPosition",
            "getImplementorsAtPosition"].forEach(function(elm){

                proto[elm] = function(fileName, pos,  id) {
                    var referenceEntries = this.languageService[elm](fileName, pos);
                    var ret = referenceEntries.map(function (ref) {
                        return {
                            unitIndex: ref.unitIndex,
                            minChar: ref.ast.minChar,
                            limChar: ref.ast.limChar
                        };
                    });
                    this.sender.callback(ret, id);
                };
            });

        ["getNavigateToItems",
            "getScriptLexicalStructure",
            "getOutliningRegions "].forEach(function(elm){
                proto[elm] = function(value, id) {
                    var navs = this.languageService[elm](value);
                    this.sender.callback(navs, id);
                };
            });


        /**
         * @param {string} scriptCode
         */
        this.compile = function (scriptCode)
        {
            console.log("worker.compile");
            try
            {
                var cst = davinciPy.parser.parse('fileName', scriptCode);
                var ast = davinciPy.builder.astFromParse(cst, 'fileName');
                var st = davinciPy.symtable.symbolTable(ast, 'fileName');
                var compiled = davinciPy.skCompiler.compile(scriptCode, 'fileName');
                return compiled.code;
            }
            catch(e)
            {
                return "" + e;
            }
            
            return scriptCode;
        };

        this.onUpdate = function()
        {
            console.log("worker.onUpdate");
            
            this.scriptManager.updateScript("temp.ts", this.doc.getValue() , false);

            var annotations = [];
            var self = this;
            this.sender.emit("compiled", this.compile(this.doc.getValue()));

            var errors = this.scriptManager.getLanguageService().getScriptErrors("temp.ts", 100);
            errors.forEach(function(error)
            {
                var pos = DocumentPositionUtil.getPosition(self.doc, error.minChar);
                console.log("pos: " + JSON.stringify(pos));
                annotations.push({
                    row: pos.row,
                    column: pos.column,
                    text: error.message,
                    minChar:error.minChar,
                    limChar:error.limChar,
                    type: "error",
                    raw: error.message
                });
            });

            this.sender.emit("compileErrors", annotations);
        };

    }).call(PythonWorker.prototype);

});
