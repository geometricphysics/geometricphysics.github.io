/**
 * LanguageServiceHost
 *
 * This is used by both the TypeScriptWorker as well as the client.
 *
 * It is essentially a repository of scripts organized by fileName and their content.
 *
 * The API is fairly neutral form the point of adding and removing scripts, but it 
 * does support Microsoft TypeScript interfaces so that it can be decorated into
 * a language service.
 */
define(function(require, exports, module)
{
    var tsLib = require('./typescriptServices').TypeScript;
    var Services = tsLib.Services;
    var LineMap1 = tsLib.LineMap1;
    var ScriptSnapshot = tsLib.ScriptSnapshot;
    var TextChangeRange = tsLib.TextChangeRange;
    var TextSpan = tsLib.TextSpan;

    var ScriptInfo = (function ()
    {
        function ScriptInfo(fileName, content)
        {
            this.fileName = fileName;
            this.version = 1;
            this.editRanges = [];
            this.setContent(content);
        }

        ScriptInfo.prototype.setContent = function (content)
        {
            this.content = content;
            this.lineMap = null;
        };
        
        ScriptInfo.prototype.getLineMap = function ()
        {
            if (!this.lineMap)
            {
                this.lineMap = LineMap1.fromString(this.content);
            }
            return this.lineMap;
        };

        ScriptInfo.prototype.updateContent = function (content)
        {
            this.editRanges = [];
            this.setContent(content);
            this.version++;
        };

        ScriptInfo.prototype.editContent = function (minChar, limChar, newText)
        {
            // Apply edits
            var prefix = this.content.substring(0, minChar);
            var middle = newText;
            var suffix = this.content.substring(limChar);
            this.setContent(prefix + middle + suffix);

            // Store edit range and the length of the script.
            var length = this.content.length;
            var range = new TextChangeRange(TextSpan.fromBounds(minChar, limChar), newText.length);

            this.editRanges.push({'length': length, 'textChangeRange': range});

            // Bump the version.
            this.version++;
        };

        ScriptInfo.prototype.getTextChangeRangeSinceVersion = function (version)
        {
            if(this.version === version)
            {
                // No edits.
                return TextChangeRange.unchanged;
            }

            var initialEditRangeIndex = this.editRanges.length - (this.version - version);

            var entries = this.editRanges.slice(initialEditRangeIndex);
            
            return TextChangeRange.collapseChangesAcrossMultipleVersions(entries.map(function (e) {
                return e.textChangeRange;
            }));
        };
        return ScriptInfo;
    })();
    exports.ScriptInfo = ScriptInfo;

    var LanguageServiceHost = (function ()
    {
        function LanguageServiceHost()
        {
            this.compilationSettings = null;
            this.scripts = {};
            this.maxScriptVersions = 100;
        }

        LanguageServiceHost.prototype.getScriptFileNames = function ()
        {
            return Object.keys(this.scripts);
        };

        LanguageServiceHost.prototype.getScriptIsOpen = function (fileName)
        {
            return true;
        };

        LanguageServiceHost.prototype.getScriptByteOrderMark = function (fileName)
        {
            return null;
        };

        LanguageServiceHost.prototype.getLocalizedDiagnosticMessages = function ()
        {
            return "";
        };

        ///////////////////////////////////////////////////////////////////////
        // IReferenceResolveHost implementation

        LanguageServiceHost.prototype.fileExists = function (path)
        {
            console.log('LanguageServiceHost.fileExists(' + path + ')')
            return true;
        };

        LanguageServiceHost.prototype.directoryExists = function (path)
        {
            console.log('LanguageServiceHost.directoryExists(' + path + ')')
            return true;
        };

        LanguageServiceHost.prototype.getParentDirectory = function (path)
        {
            console.log('LanguageServiceHost.getParentDirectory(' + path + ')')
            return "";
        };

        LanguageServiceHost.prototype.resolveRelativePath = function (path, directory)
        {
            console.log('LanguageServiceHost.resolveRelativePath(' + path + " " + directory + ')')
            return "";
        };

        LanguageServiceHost.prototype.getScriptSnapshot = function (fileName)
        {
            var script = this.scripts[fileName];
            var result = ScriptSnapshot.fromString(script.content);

            // Quick hack
            result["getTextChangeRangeSinceVersion"] = function (version)
            {
                return null;
                // return new TextChangeRange(new TextSpan(0, script.content.length),script.content.length);
            };

            return result;
        };

        ///////////////////////////////////////////////////////////////////////
        // local implementation

        LanguageServiceHost.prototype.addScript = function (fileName, content)
        {
//          console.log('LanguageServiceHost.addScript(' + JSON.stringify({'fileName':fileName}) + ')');

            var script = new ScriptInfo(fileName, content);
            this.scripts[fileName] = script;
        };

        LanguageServiceHost.prototype.updateScript = function (fileName, content)
        {
//          console.log('LanguageServiceHost.updateScript(' + JSON.stringify({'fileName':fileName}) + ')');

            var script = this.scripts[fileName];
            if (script)
            {
                script.updateContent(content);
            }
            else
            {
                this.addScript(fileName, content);
            }
        };

        LanguageServiceHost.prototype.editScript = function (fileName, minChar, limChar, newText)
        {
//          console.log("LanguageServiceHost.editScript");
            
            var script = this.scripts[fileName];
            if (script)
            {
                script.editContent(minChar, limChar, newText);
            }
            else
            {
                throw new Error("No script with fileName '" + fileName + "'");
            }
        };

        LanguageServiceHost.prototype.removeScript = function (fileName)
        {
            console.log('LanguageServiceHost.removeScript(' + JSON.stringify({'fileName':fileName}) + ')');

            var script = this.scripts[fileName];
            if (script)
            {
                delete this.scripts[fileName];
            }
            else
            {
                throw new Error("No script with fileName '" + fileName + "'");
            }
        };

        ///////////////////////////////////////////////////////////////////////
        // ILogger implementation

        LanguageServiceHost.prototype.information = function ()
        {
            return false;
        };

        LanguageServiceHost.prototype.debug = function ()
        {
            return false;
        };

        LanguageServiceHost.prototype.warning = function ()
        {
            return false;
        };

        LanguageServiceHost.prototype.error = function ()
        {
            return false;
        };

        LanguageServiceHost.prototype.fatal = function ()
        {
            return false;
        };

        LanguageServiceHost.prototype.log = function (s)
        {

        };

        LanguageServiceHost.prototype.getDiagnosticsObject = function ()
        {
            var diagnostics = 
            {
                log: function (content) {}
            };
            return diagnostics;
        };

        ///////////////////////////////////////////////////////////////////////
        // ILanguageServiceHost implementation

        LanguageServiceHost.prototype.getCompilationSettings = function ()
        {
            return this.compilationSettings;
        };

        LanguageServiceHost.prototype.setCompilationSettings = function (value)
        {
            this.compilationSettings = value;
        };

        LanguageServiceHost.prototype.getScriptVersion = function (fileName)
        {
            var script = this.scripts[fileName];
            return script.version;
        };

        /**
         * Apply an array of text edits to a string, and return the resulting string.
         */
        LanguageServiceHost.prototype.applyEdits = function (content, edits)
        {
            var result = content;
            edits = this.normalizeEdits(edits);

            for(var i = edits.length - 1; i >= 0; i--)
            {
                var edit = edits[i];
                var prefix = result.substring(0, edit.minChar);
                var middle = edit.text;
                var suffix = result.substring(edit.limChar);
                result = prefix + middle + suffix;
            }
            return result;
        };

        /**
         * Normalize an array of edits by removing overlapping entries and sorting
         * entries on the "minChar" position.
         */
        LanguageServiceHost.prototype.normalizeEdits = function (edits)
        {
            var result = [];

            function mapEdits(edits)
            {
                var result = [];
                for(var i = 0; i < edits.length; i++)
                {
                    result.push({'edit': edits[i], 'index': i});
                }
                return result;
            }

            var temp = mapEdits(edits).sort(function (a, b)
            {
                var result = a.edit.minChar - b.edit.minChar;
                if (result === 0)
                {
                    result = a.index - b.index;
                }
                return result;
            });

            var current = 0;
            var next = 1;
            while (current < temp.length)
            {
                var currentEdit = temp[current].edit;

                // Last edit.
                if (next >= temp.length)
                {
                    result.push(currentEdit);
                    current++;
                    continue;
                }
                var nextEdit = temp[next].edit;

                var gap = nextEdit.minChar - currentEdit.limChar;

                // non-overlapping edits.
                if (gap >= 0)
                {
                    result.push(currentEdit);
                    current = next;
                    next++;
                    continue;
                }

                // overlapping edits: for now, we only support ignoring an next edit
                // entirely contained in the current edit.
                if (currentEdit.limChar >= nextEdit.limChar)
                {
                    next++;
                    continue;
                }
                else
                {
                    throw new Error("Trying to apply overlapping edits");
                }
            }
            return result;
        };
        return LanguageServiceHost;
    })();
    exports.LanguageServiceHost = LanguageServiceHost;
});