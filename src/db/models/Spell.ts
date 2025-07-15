import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Spell extends Model {
  declare name: string;
  declare level: number;
  declare school: string;
}

Spell.init(
  {
    name: {
      type: DataTypes.STRING(40),
      allowNull: false,
      primaryKey: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    school: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
    const spellData = (await import('~/../spells.json')).default;

    console.log(spellData);
    try {
        for (const spell of spellData) {
            await Spell.create({
                name: spell.name,
                level: spell.level,
                school: spell.school,
            });
        }
    } catch (error) {
        console.error('Error seeding spell data:', error);
    }
}

export { seed };
