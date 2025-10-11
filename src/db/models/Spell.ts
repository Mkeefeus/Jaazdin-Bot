import { DataTypes, Model } from 'sequelize';
import { db } from '~/db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Spell extends Model {
  declare name: string;
  declare level: number;
  declare school: string;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Spell.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    school: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  const spellData = (await import('~/seeds/spells.json')).default;
  try {
    for (const spell of spellData) {
      await Spell.create({
        name: spell.name,
        level: spell.level,
        school: spell.school,
      });
    }
    console.log('Seeded spells');
  } catch (error) {
    console.error('Error seeding spell data:', error);
  }
}

export { seed };

Spell.sync();
