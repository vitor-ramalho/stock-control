export abstract class FiscalXmlValidator {
  abstract validate(xml: string): Promise<void>;
}
