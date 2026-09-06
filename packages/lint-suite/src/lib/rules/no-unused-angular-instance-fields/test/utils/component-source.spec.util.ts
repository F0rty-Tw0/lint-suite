type ComponentSourceOptions = {
  readonly metadata?: string;
  readonly imports?: string;
  readonly decorator?: string;
  readonly classDeclaration?: string;
};

export const component = (
  body: string,
  options: ComponentSourceOptions = {}
): string => {
  const {
    metadata = "template: ''",
    imports = 'Component',
    decorator = 'Component',
    classDeclaration = 'class TestComponent'
  } = options;

  return `import { ${imports} } from '@angular/core'; @${decorator}({ ${metadata} }) ${classDeclaration} { ${body} }`;
};
