import React from 'react';
import CategoryPage from '../components/CategoryPage';

const HERITAGE_TEXT =
  "Portemilio Hotel and Resort opened three decades ago with a simple intention: to create a place where people feel at home, not just for a stay, but across moments and generations. Set across more than 50,000m² by the sea, it offers the space to slow down, settle in, and feel part of something lasting. As both a hotel and a resort, it has become a place where some come for a visit, and others choose to stay, finding their own rhythm of life here.\n\n" +
  "At the heart of this is the people behind Portemilio. The team is not just staff, but a close knit group that cares, remembers, and welcomes with sincerity. Many have been here for years, building real relationships with guests and residents alike. This continuity creates a sense of trust and warmth that is felt in every interaction, and in every detail.\n\n" +
  "Over the years, Portemilio has also had the privilege of welcoming distinguished guests, including members of royalty and international figures. This has always been approached with quiet humility. It reflects values that remain central to Portemilio: discretion, respect, and a genuine commitment to making every guest feel comfortable and cared for.\n\n" +
  "Today, Portemilio continues to grow while staying true to what defines it. It is a place shaped by people, where lives unfold naturally, where memories are created over time, and where the intention remains simple: to be here for you, in the moments that matter most.";

export default function HeritageScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Since 1996"
      images={[require('../assets/portemilio_vintage.jpg')]}
      description={HERITAGE_TEXT}
      descriptionStyle={{
        marginHorizontal: 0,
        textAlign: 'justify',
        lineHeight: 23,
      }}
    />
  );
}
