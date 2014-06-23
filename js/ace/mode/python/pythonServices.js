define(function(require, exports, module) {

  var Language = {

  };

  function LanguageService() {

  }
  LanguageService.prototype.getOccurrencesAtPosition = function() {

  };
  LanguageService.prototype.getCompletionsAtPosition = function() {

  };

  function LanguageServiceShim(host) {

  }
  LanguageServiceShim.prototype.getScriptErrors = function(fileName, limit) {
//  var error = {minChar:60, limChar: 15, message: 'whatever?'};
    return [];
  };
  LanguageServiceShim.prototype.getLanguageService = function() {
    return new LanguageService();
  }

  function ServicesFactory() {

  }
  ServicesFactory.prototype.createLanguageServiceShim = function(host) {
    return new LanguageServiceShim(host);
  };

  var Services = {
    ServicesFactory: ServicesFactory
  };

  exports.Language = Language;
  exports.Services = Services;
});
