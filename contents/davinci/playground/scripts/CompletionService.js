define(["require", "exports", 'scripts/EditorPosition'], function(require, exports, epLib)
{
    var CompletionService = (function ()
    {
        function CompletionService(editor, languageService)
        {
            this.editor = editor;
            this.ls = languageService;
            this.editorPos = new epLib.EditorPosition(editor);
        }
        CompletionService.prototype.getCompletionsAtPosition = function(fileName, position, memberMode)
        {
            var args = {'fileName': fileName, 'position': position, 'memberMode': memberMode};
            // console.log('CompletionService.getCompletionsAtPosition(' + JSON.stringify(args) + ')');
            var compInfo;
            compInfo = this.ls.getCompletionsAtPosition(fileName, position, memberMode);
            return compInfo;
        };
        CompletionService.prototype.getCursorCompletionInfo = function (script, cursor)
        {
            var memberMode, matches, pos, text;
            pos = this.editorPos.getPositionChars(cursor);
            text = this.editor.session.getLine(cursor.row).slice(0, cursor.column);
            memberMode = false;
            matches = text.match(/\.([a-zA-Z_0-9\$]*$)/);
            if(matches && matches.length > 0)
            {
                this.matchText = matches[1];
                memberMode = true;
                pos -= this.matchText.length;
            }
            else
            {
                matches = text.match(/[a-zA-Z_0-9\$]*$/);
                this.matchText = matches[0];
            }
            return this.getCompletionsAtPosition(script, pos, memberMode);
        };
        return CompletionService;
    })();
    exports.CompletionService = CompletionService;
})
