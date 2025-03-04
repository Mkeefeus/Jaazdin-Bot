import { Domain, Religion } from '~/db/models/Religion';
//import showReligion from '~/commands/religion/showReligion';
//import showAllReligions from '~/commands/religion/showAllReligions';

async function update() {}
async function post() {
  const religions = await Religion.findAll({ order: [['follower_count', 'DESC']] });

  for (let i = 0; i < religions.length; i++) {
    let message = `${religions[i].dataValues.name} has ${religions[i].dataValues.follower_count} followers.`;
    // show the dominant religion effect. 
    if (i == 0) {
      const domainData = await Domain.findOne({
        where: {
          id: religions[i].dataValues.domain_id,
        },
      });
       message += `\nDominant effect: `+  domainData?.dataValues.dominant_effect;
    }
    //show each religion. 
    console.log(message);
  }
}

export { update, post };
