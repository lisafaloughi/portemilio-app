import React from 'react';
import CategoryPage from '../components/CategoryPage';

export default function PoolsScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Pools"
      images={[require('../assets/pools.png')]}
      description="Two outdoor pools right on the seafront — one Olympic-size — plus a kids' fountain and a heated indoor semi-Olympic pool in the Health Club."
      rows={[
        { icon: 'pool', title: 'Olympic Pool', subtitle: 'Seaside · Sunrise – sunset' },
        { icon: 'waves', title: 'Outdoor Pool', subtitle: 'Open year-round · Seafront' },
        { icon: 'baby-face-outline', title: "Kids' Fountain", subtitle: 'Beachfront · Supervised by parents' },
        { icon: 'pool-thermometer', title: 'Indoor Pool', subtitle: 'Health Club · Heated · 6 AM – 9 PM' },
        { icon: 'umbrella-outline', title: 'Loungers & towels', subtitle: 'Complimentary for guests' },
      ]}
    />
  );
}
