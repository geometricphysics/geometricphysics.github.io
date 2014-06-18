var samples = [];

var sample = function(id)
{
  var editorElement = document.getElementById('element' + id);
  var outputElement = document.getElementById('output' + id);

  var editor = ace.edit('editor' + id);
  editor.setTheme('ace/theme/twilight');
  editor.getSession().setMode('ace/mode/python');
  editor.setShowInvisibles(true);
  editor.setFontSize(15);

  var originalValue = editor.getValue();

  function outputFn(text)
  {
    outputElement.innerHTML += text;
  }
  function builtinRead(x)
  {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
    {
      throw "File not found: '" + x + "'";
    }
    return Sk.builtinFiles["files"][x];
  }

  function run()
  {
    var program = editor.getValue();
    clear();
    Sk.configure({"output": outputFn, "read": builtinRead});
    try
    {
      eval(Sk.importMainWithBody("<stdin>", false, program));
    }
    catch(e) {
      window.alert(e);
    }
  }

  function clear()
  {
    outputElement.innerHTML = '';
  }

  function reset()
  {
    clear()
    editor.setValue(originalValue);
    editor.focus();
    editor.gotoLine(0, 0);
  }

  var that =
  {
    'run': run,
    'clear': clear,
    'reset': reset
  };
  return that;
};
