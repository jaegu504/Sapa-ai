import { describe, it, expect } from 'vitest';
import { parseVcf, parseCsv } from '../../src/utils/contactImportParsers';

describe('contactImportParsers', () => {
  describe('parseVcf', () => {
    it('parses standard vCard with FN and TEL', () => {
      const vcfData = `
BEGIN:VCARD
VERSION:3.0
FN:Budi Santoso
TEL;TYPE=CELL:+628123456789
ORG:PT Nusantara Digital
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Siti Aminah
TEL;TYPE=HOME:08198765432
END:VCARD
      `.trim();

      const contacts = parseVcf(vcfData);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('Budi Santoso');
      expect(contacts[0].phoneNumber).toBe('+628123456789');
      expect(contacts[0].associations).toContain('PT Nusantara Digital');

      expect(contacts[1].name).toBe('Siti Aminah');
      expect(contacts[1].phoneNumber).toBe('+628198765432');
    });

    it('falls back to N field when FN is missing', () => {
      const vcfData = `
BEGIN:VCARD
VERSION:2.1
N:Pratama;Raditya;;;
TEL;CELL:+628111222333
END:VCARD
      `.trim();

      const contacts = parseVcf(vcfData);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Raditya Pratama');
      expect(contacts[0].phoneNumber).toBe('+628111222333');
    });

    it('ignores cards without a valid phone number', () => {
      const vcfData = `
BEGIN:VCARD
VERSION:3.0
FN:Tanpa Nomor
EMAIL:no-phone@example.com
END:VCARD
      `.trim();

      const contacts = parseVcf(vcfData);
      expect(contacts).toHaveLength(0);
    });
  });

  describe('parseCsv', () => {
    it('parses standard simple CSV with Name,Phone headers', () => {
      const csvData = `
Name,Phone,Category
Ahmad Dahlan,+6281234567890,Sahabat
Dewi Sartika,085612345678,Kerja
      `.trim();

      const contacts = parseCsv(csvData);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('Ahmad Dahlan');
      expect(contacts[0].phoneNumber).toBe('+6281234567890');
      expect(contacts[0].associations).toContain('Sahabat');

      expect(contacts[1].name).toBe('Dewi Sartika');
      expect(contacts[1].phoneNumber).toBe('+6285612345678');
    });

    it('parses Google Contacts export CSV format', () => {
      const googleCsv = `
Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,Phone 1 - Type,Phone 1 - Value
Ustadz Hilman,Hilman,,Ustadz,,,,,,,,,,,,,,,,,,,,,,,* myContacts ::: * star,Mobile,+62 813-4567-8901
Dr. Aisyah,Aisyah,,Dr.,,,,,,,,,,,,,,,,,,,,,,,* myContacts,Mobile,0812-9876-5432
      `.trim();

      const contacts = parseCsv(googleCsv);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('Ustadz Hilman');
      expect(contacts[0].phoneNumber).toBe('+6281345678901');

      expect(contacts[1].name).toBe('Dr. Aisyah');
      expect(contacts[1].phoneNumber).toBe('+6281298765432');
    });

    it('handles semicolon separated CSV and quotes properly', () => {
      const semiCsv = `
"Nama Lengkap";"Nomor HP";"Label"
"Khadijah";"+6287811223344";"Keluarga"
      `.trim();

      const contacts = parseCsv(semiCsv);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Khadijah');
      expect(contacts[0].phoneNumber).toBe('+6287811223344');
      expect(contacts[0].associations).toContain('Keluarga');
    });
  });
});
