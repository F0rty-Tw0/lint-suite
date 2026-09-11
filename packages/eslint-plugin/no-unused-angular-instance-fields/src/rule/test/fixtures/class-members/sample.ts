export class Base {
  inherited = 0;
}

export class Widget extends Base {
  title = 'x';

  'quoted' = 1;

  #secret = 2;

  get title2(): string {
    return this.title;
  }

  set title2(value: string) {
    this.title = value;
  }

  direct(): number {
    return this.title.length + this.#secret + this['quoted'];
  }

  arrow = (): number => this.title.length;

  nestedFunction(): number {
    return [1].map(function () {
      return this.title;
    }).length;
  }

  objectLiteral(): number {
    const literal = {
      method() {
        return this.title;
      }
    };

    return literal.method();
  }
}
