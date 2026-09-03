export function component(
  body: string,
  metadata = "template: ''",
  imports = 'Component',
  decorator = 'Component',
  classDeclaration = 'class TestComponent'
) {
  return `import { ${imports} } from '@angular/core'; @${decorator}({ ${metadata} }) ${classDeclaration} { ${body} }`;
}
