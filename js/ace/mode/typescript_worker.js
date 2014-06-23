/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {
    "no use strict";

    var oop = require("../lib/oop");
    var Mirror = require("../worker/mirror").Mirror;
    var lang = require("../lib/lang");
    var Document = require("../document").Document;
    var DocumentPositionUtil = require('./typescript/DocumentPositionUtil').DocumentPositionUtil;

    var TypeScript = require('./typescript/typescriptServices').TypeScript;
    var Services = TypeScript.Services;
    var ScriptManager = require('./typescript/harness').ScriptManager;

    var TypeScriptWorker = exports.TypeScriptWorker = function(sender)
    {
        this.sender = sender;
        var doc = this.doc = new Document("");

        var deferredUpdate = this.deferredUpdate = lang.deferredCall(this.onUpdate.bind(this));

        this.scriptManager =  new ScriptManager();
        if (typeof Services !== 'undefined')
        {
            this.ServicesFactory = new Services.TypeScriptServicesFactory();
            this.serviceShim = this.ServicesFactory.createLanguageServiceShim(this.scriptManager);
            this.languageService = this.serviceShim.languageService;
        }

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

    oop.inherits(TypeScriptWorker, Mirror);

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
            this.scriptManager.addScript(name, content.replace(/\r\n?/g,"\n"), true);
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
         * @param {string} typeScriptCode
         */
        this.compile = function (typeScriptCode)
        {
            console.log("worker.compile");
            console.log(typeScriptCode);
            var output = "";
            
            var outfile = {
                Write: function (s) {
                    output  += s;
                },
                WriteLine: function (s) {
                    output  += s + "\n";
                },
                Close: function () {
                }
            };
            
            var outerr = {
                Write: function (s) {
                },
                WriteLine: function (s) {
                },
                Close: function () {
                }
            };

            var compiler = new TypeScript.TypeScriptCompiler();
            
            var scriptSnapshot = {
                getLength: function() {
                    return typeScriptCode.length;
                },
                getText: function(begin, end) {
                    console.log("begin: " + begin);
                    console.log("end: " + end);
                    return typeScriptCode.substring(begin, end);
                }
            };

            compiler.addFile("output.js", scriptSnapshot);

            function resolvePath(path)
            {
                return path;
            }
            /*
            try
            {
                for (var it = compiler.compile(function (path) {return resolvePath(path);}); it.moveNext();)
                {
//                    var result = it.current();

//                        result.diagnostics.forEach(function (d)
//                        {
//                          return _this.addDiagnostic(d);
//                        });

//                        if (!this.tryWriteOutputFiles(result.outputFiles)) {
//                            return;
//                        }

                }
            }
            catch(e)
            {
                console.log(e);
            }
            */
            /*
            if (typeof TypeScript !== 'undefined')
            {
                var logger = new TypeScript.NullLogger();
                var settings = new TypeScript.CompilationSettings();
                //var compiler = new TypeScript.TypeScriptCompiler();
                var compiler = undefined;
                if (typeof compiler === 'object')
                {
                    var scriptSnapshot =
                    {
                        getLength: function()
                        {
                            return typeScriptCode.length;
                        },
                        getText: function(begin, end)
                        {
                            console.log("begin: " begin);
                            console.log("end: " end);
                            return typeScriptCode;
                        }
                    };
//                  compiler.addFile("output.js", scriptSnapshot);

                    function resolvePath(path)
                    {
                        return path;
                    }

                    try
                    {
                        for (var it = compiler.compile(function (path) {return resolvePath(path);}); it.moveNext();)
                        {
                            var result = it.current();
    
    //                        result.diagnostics.forEach(function (d)
    //                        {
    //                          return _this.addDiagnostic(d);
    //                        });
    
    //                        if (!this.tryWriteOutputFiles(result.outputFiles)) {
    //                            return;
    //                        }
    
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }


//                  compiler.addUnit(typeScriptCode, "output.js", false);
//                  compiler.typeCheck();

//                    compiler.emit(false, function (name) {
//                        console.log("emitting: " + name);
//                    });
                }
            }
            else
            {
                console.log("TypeScript is not available in typescript_worker.js");
            }
            */
            return output;
        };

        this.onUpdate = function()
        {
            console.log("worker.onUpdate");
            
            this.scriptManager.updateScript("temp.ts", this.doc.getValue() , false);

            console.log("worker.getLanguageService: " + (typeof this.scriptManager.getLanguageService));

            var annotations = [];
            var self = this;
            this.sender.emit("compiled", this.compile(this.doc.getValue()));

//          var errors = this.scriptManager.getLanguageService().getScriptErrors("temp.ts", 100);
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
