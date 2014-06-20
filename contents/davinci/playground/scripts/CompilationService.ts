import EditorPositionModule = module('./EditorPosition');

export class CompilationService{

    public editorPos;// The ace control
    public matchText;

    constructor(public editor,public ServiceShim){
        this.editorPos = new EditorPositionModule.EditorPosition(editor);
    }

    getCompilation (script, charpos, isMemberCompletion) {
        var compInfo;
        compInfo = this.ServiceShim.languageService.getCompletionsAtPosition(script, charpos, isMemberCompletion);
        return compInfo;
    };

    getCursorCompilation(script, cursor) {
        var isMemberCompletion, matches, pos, text;
        pos = this.editorPos.getPositionChars(cursor);
        text = this.editor.session.getLine(cursor.row).slice(0, cursor.column);
        isMemberCompletion = false;
        matches = text.match(/\.([a-zA-Z_0-9\$]*$)/);

        if (matches && matches.length > 0) {
             this.matchText = matches[1];
            isMemberCompletion = true;
            pos -= this.matchText.length;
        } else {
            matches = text.match(/[a-zA-Z_0-9\$]*$/);
            this.matchText = matches[0];
        }
        return this.getCompilation(script, pos, isMemberCompletion);
    };

    getCurrentPositionCompilation (script) {
        return this.getCursorCompilation(script, this.editor.getCursorPosition());
    };
}