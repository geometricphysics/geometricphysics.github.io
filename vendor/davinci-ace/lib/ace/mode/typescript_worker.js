/**
 * TypeScriptWorker
 *
 * N.B. Considered to be an ACE editor component and so all APIs should be in terms of ACE objects.
 * i.e. The exposure of the (Microsoft) TypeScript implementation should be hidden.
 * Since most communication is through events, ensure that event messages have an ACE flavor. 
 */
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
    var LanguageServiceHost = require('./typescript/LanguageServiceHost').LanguageServiceHost;

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
            this.options = options || {};
        };

        this.changeOptions = function(newOptions)
        {
            oop.mixin(this.options, newOptions);
            this.deferredUpdate.schedule(100);
        };

        this.addlibrary = function(fileName, content)
        {
            this.lsHost.addScript(fileName, content.replace(/\r\n?/g, '\n'));
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

        /**
         * This method is called in a deferred manner as a result of a 'change' event in the sender. 
         */
        this.onUpdate = function()
        {
            var result = {};
            var scripts = this.lsHost.scripts;
            var ls = this.ls;
            var sender = this.sender;
            var doc = this.doc;

            function compile(code)
            {
                var annotations;

                /**
                 * Converts the error to an annotation as well as having 'minChar' and 'limChar' properties.
                 */
                function convertError(tsError)
                {
                    var minChar = tsError.start();
                    var limChar = minChar + tsError.length();
                    var error = {'minChar': minChar, 'limChar': limChar};
                    // ACE annotation properties.
                    var pos = DocumentPositionUtil.getPosition(doc, minChar);
                    error.text = tsError.message();
                    error.row = pos.row;
                    error.column = pos.column;
                    error.type = 'error'; // Determines the icon that appears for the annotation.
                    return error;
                }

                for (var fileName in scripts)
                {
                    annotations = [];
                    try
                    {
                        var emitOutput = ls.getEmitOutput(fileName);

                        var syntaxErrors = ls.getSyntacticDiagnostics(fileName);
                        var semanticErrors = ls.getSemanticDiagnostics(fileName);

                        if (syntaxErrors && syntaxErrors.length)
                        {
                            syntaxErrors.forEach(function(tsError)
                            {
                                annotations.push(convertError(tsError));
                            });
                        }

                        if (semanticErrors && semanticErrors.length)
                        {
                            semanticErrors.forEach(function(tsError)
                            {
                                annotations.push(convertError(tsError));
                            });
                        }

                        if (fileName === 'temp.ts')
                        {
                            sender.emit("compileErrors", annotations);
                        }

                        emitOutput.outputFiles.forEach(function(file)
                        {
                            result[file.name] = file.text;
                        });
                    }
                    catch(e)
                    {
                        console.log("" + e);
                    }
                }

                var response ={'text': result['temp.js']};
                return response;
            }

            this.lsHost.updateScript("temp.ts", this.doc.getValue());

            this.sender.emit("compiled", compile(this.doc.getValue()));
        };

    }).call(TypeScriptWorker.prototype);
});
