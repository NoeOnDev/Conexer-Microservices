import { Pool } from "pg";
import { Contact } from "../../domain/Contact";
import { ContactRepository } from "../../domain/ContactRepository";
import { ContactStatus } from "../../domain/value-objects/ContactStatus";
import { ContactHobby } from "../../domain/value-objects/ContactHobbit";
import { Identifier } from "../../../_shared/domain/value-objects/Identifier";

export class PostgresContactRepository implements ContactRepository {
  constructor(private pool: Pool) {}

  private mapRowToContact(row: any): Contact {
    return new Contact(
      row.first_name,
      row.last_name,
      row.email,
      row.phone,
      ContactHobby.fromString(row.hobby),
      ContactStatus.fromValue(row.status),
      Identifier.fromString(row.id)
    );
  }

  async save(contact: Contact): Promise<void> {
    const query = `
      INSERT INTO contacts (id, first_name, last_name, email, phone, status, hobby)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE
      SET first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          status = EXCLUDED.status,
          hobby = EXCLUDED.hobby;
    `;
    const values = [
      contact.getId().getValue(),
      contact.getFirstName(),
      contact.getLastName(),
      contact.getEmail(),
      contact.getPhone(),
      contact.getStatus().getValue(),
      contact.getHobby().getValue(),
    ];
    await this.pool.query(query, values);
  }

  async findAll(): Promise<Contact[]> {
    const query = `SELECT * FROM contacts`;
    const result = await this.pool.query(query);
    return result.rows.map((row) => this.mapRowToContact(row));
  }

  async findById(id: Identifier): Promise<Contact | null> {
    const query = `SELECT * FROM contacts WHERE id = $1`;
    const result = await this.pool.query(query, [id.getValue()]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToContact(result.rows[0]);
  }

  async findByEmail(email: string): Promise<Contact | null> {
    const query = `SELECT * FROM contacts WHERE email = $1 ORDER BY created_at DESC`;
    const result = await this.pool.query(query, [email]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToContact(result.rows[0]);
  }

  async deleteById(id: Identifier): Promise<void> {
    const query = `DELETE FROM contacts WHERE id = $1`;
    await this.pool.query(query, [id.getValue()]);
  }
}
