// Note: can use any name here, but has to be the same throughout this file
declare function eagle(name: string): eagle;
declare module eagle {
    var favorite: string;
    function soar(): void;
}
interface eagle {
    new(awesomeness: number): eagle;
    // This is the correct place for the fly function.
    function fly(): void;
}

declare module "eagle" {
  // The eagle here is a variable name, not a type name.
  // So it does not refer to the interface.
  // The module and function are both in the same variable
  // namespace and so get merged.
  export = eagle;
}
