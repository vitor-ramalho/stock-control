import { BadRequestException, Injectable } from '@nestjs/common';
import { FiscalXmlValidator } from '../ports/fiscal-xml-validator.port';

@Injectable()
export class FiscalXmlValidatorService implements FiscalXmlValidator {
  async validate(xml: string): Promise<void> {
    const requiredTags = ['enviNFe', 'NFe', 'infNFe', 'ide', 'emit', 'total'];
    const missing = requiredTags.filter((tag) => !xml.includes(`<${tag}`));

    if (missing.length > 0) {
      throw new BadRequestException(`Invalid fiscal XML structure. Missing tags: ${missing.join(', ')}`);
    }
  }
}
