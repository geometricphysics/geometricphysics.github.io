define(function(require, exports, module)
{
    "no use strict";

    var oop = require("../lib/oop");
    var Mirror = require("../worker/mirror").Mirror;
    var lang = require("../lib/lang");
    var Document = require("../document").Document;
    var DocumentPositionUtil = require('./typescript/DocumentPositionUtil').DocumentPositionUtil;

    var TypeScript = require('./typescript/typescriptServices').TypeScript;
    var Services = TypeScript.Services;
    var TypeScriptServicesFactory = Services.TypeScriptServicesFactory;
    var LanguageServiceHost = require('./typescript/harness').LanguageServiceHost;

    var TypeScriptWorker = exports.TypeScriptWorker = function(sender)
    {
        this.sender = sender;
        var doc = this.doc = new Document("");

        var deferredUpdate = this.deferredUpdate = lang.deferredCall(this.onUpdate.bind(this));

        this.lsHost =  new LanguageServiceHost();
        if (typeof Services !== 'undefined')
        {
            this.ls = new TypeScriptServicesFactory().createPullLanguageService(this.lsHost);
        }

        var self = this;
        sender.on("change", function(e)
        {
            doc.applyDeltas(e.data);
            deferredUpdate.schedule(self.$timeout);
        });

        sender.on("addLibrary", function(message)
        {
//          console.log("message.data.fileName: " + JSON.stringify(message.data.fileName));
            // This call, in turn will add the library to the lsHost.
            self.addlibrary(message.data.fileName , message.data.content);
        });



        this.setOptions();
        sender.emit("initAfter");
    };

    oop.inherits(TypeScriptWorker, Mirror);

    (function() {

        var proto = this;

        this.setOptions = function(options)
        {
//          console.log('worker.setOptions(' + JSON.stringify(options) + ')');
            this.options = options || {};
        };

        this.changeOptions = function(newOptions)
        {
            console.log("worker.changeOptions");
            oop.mixin(this.options, newOptions);
            this.deferredUpdate.schedule(100);
        };

        this.addlibrary = function(fileName, content)
        {
//          console.log('worker.addLibrary(' + fileName + ')');
            this.lsHost.addScript(fileName, content.replace(/\r\n?/g,"\n"));
        };

        ["getTypeAtPosition",
            "getSignatureAtPosition",
            "getDefinitionAtPosition"].forEach(function(elm){
                proto[elm] = function(fileName, pos,  id) {
                    var ret = this.ls[elm](fileName, pos);
                    this.sender.callback(ret, id);
                };
            });

        ["getReferencesAtPosition",
            "getOccurrencesAtPosition",
            "getImplementorsAtPosition"].forEach(function(elm){

                proto[elm] = function(fileName, pos,  id) {
                    var referenceEntries = this.ls[elm](fileName, pos);
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
                    var navs = this.ls[elm](value);
                    this.sender.callback(navs, id);
                };
            });


        this.onUpdate = function()
        {
//          console.log("worker.onUpdate");

            var result = {};
            var errors = {};
            var scripts = this.lsHost.scripts;
            var ls = this.ls;

            function compile(code)
            {
//              console.log("worker.compile");

                for (var fileName in scripts)
                {
//                  console.log("fileName: " + fileName);
                    try
                    {
                        var emitOutput = ls.getEmitOutput(fileName);

                        var fileErrors = ls.getSyntacticDiagnostics(fileName);

                        if (fileErrors && fileErrors.length)
                        {
                            console.log("errors in file " + fileName);
//                          console.log(JSON.stringify(fileErrors));
                            errors[fileName] = fileErrors;
                        }

                        emitOutput.outputFiles.forEach(function(file) {
//                          console.log(JSON.stringify(file));
                            result[file.name] = file.text;
                        });
                    }
                    catch(err)
                    {
                        console.log("err: " + err);
                    }
                }

                var response ={'text': result['temp.js']};
//              console.log(JSON.stringify(response));
                return response;
            }

            this.lsHost.updateScript("temp.ts", this.doc.getValue() , false);

            var annotations = [];
            var self = this;
            this.sender.emit("compiled", compile(this.doc.getValue()));

//          var errors = this.lsHost.getLanguageService().getScriptErrors("temp.ts", 100);
            /*
            errors.forEach(function(error)
            {
                var pos = DocumentPositionUtil.getPosition(self.doc, error.minChar);
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
            */
        };

    }).call(TypeScriptWorker.prototype);

});
