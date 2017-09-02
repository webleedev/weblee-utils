class BlockTemplate extends String {
    constructor(method) {
        switch (method) {
            case 'lib':
                super("+block('%s')");
                break;
            case 'stylus-bem':
            default:
                super(".%s");
        }
    }
}

class ModTemplate extends String {
    constructor(method) {
        switch (method) {
            case 'lib':
                super("+mod('%s')");
                break;
            default:
                super("\&--%s");
        }
    }
}

class ElementTemplate extends String {
    constructor(method) {
        switch (method) {
            case 'lib':
                super("+element('%s')");
                break;
            case 'stylus-bem':
                super("/__%s");
                break;
            default:
                super("\&__%s");
        }
    }
}

class ModElementTemplate extends String {
    constructor(method) {
        switch (method) {
            case 'lib':
                super("+mod-element('%s')");
                break;
            case 'stylus-bem':
                super("/__%s");
                break;
            default:
                super("\&__%s");
        }
    }
}

module.exports = {
    Block: BlockTemplate,
    Mod: ModTemplate,
    Element: ElementTemplate,
    ModElement: ModElementTemplate
};

