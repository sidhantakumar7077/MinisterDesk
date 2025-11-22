import { router, usePathname } from 'expo-router';
import { ChevronRight, Home } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

export default function BreadcrumbNavigation() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' }
    ];

    // Map paths to breadcrumb items
    const pathMap: Record<string, string> = {
      '/': 'Home',
      '/(tabs)': 'Home',
      '/(tabs)/index': 'Home',
      '/(tabs)/calendar': 'Calendar',
      '/(tabs)/tenders': 'Tenders',
      '/(tabs)/meetings': 'Meetings',
      '/(tabs)/tour-plan': 'Tour Plan',
      '/(tabs)/tasks': 'Tasks',
      '/calls': 'Incoming Calls',
      '/meeting-requests': 'Meeting Requests',
      '/meeting-request': 'New Meeting Request',
      '/meeting-form': 'Meeting Form',
      '/CreateTourPlanModal': 'New Tour Plan',
      '/tenders': 'Tenders',
    };

    // Handle nested paths
    if (pathname !== '/' && pathname !== '/(tabs)' && pathname !== '/(tabs)/index') {
      const currentLabel = pathMap[pathname] || pathname.split('/').pop()?.replace('-', ' ') || 'Unknown';
      
      // Add intermediate breadcrumbs for nested paths
      if (pathname.startsWith('/meeting')) {
        breadcrumbs.push({ label: 'Meetings', path: '/(tabs)/meetings' });
      } else if (pathname === '/calls') {
        // Calls is accessible from home
      } else if (pathname === '/tenders') {
        breadcrumbs.push({ label: 'Tenders', path: '/(tabs)/tenders' });
      }
      
      breadcrumbs.push({ 
        label: currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1), 
        path: pathname,
        isActive: true 
      });
    } else {
      breadcrumbs[0].isActive = true;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleBreadcrumbPress = (path: string) => {
    if (path === '/') {
      router.push('/(tabs)');
    } else {
      router.push(path as any);
    }
  };

  // Don't show breadcrumbs if we're just on home
  if (breadcrumbs.length === 1 && breadcrumbs[0].isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        {breadcrumbs.map((item, index) => (
          <View key={index} style={styles.breadcrumbItem}>
            {index > 0 && (
              <ChevronRight size={14} color="#9ca3af" style={styles.separator} />
            )}
            
            {index === 0 && (
              <Home size={14} color={item.isActive ? '#1e40af' : '#6b7280'} style={styles.homeIcon} />
            )}
            
            <TouchableOpacity
              onPress={() => !item.isActive && handleBreadcrumbPress(item.path)}
              disabled={item.isActive}
              style={styles.breadcrumbButton}
            >
              <Text style={[
                styles.breadcrumbText,
                item.isActive && styles.activeBreadcrumbText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: 8,
  },
  homeIcon: {
    marginRight: 6,
  },
  breadcrumbButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeBreadcrumbText: {
    color: '#1e40af',
    fontWeight: '600',
  },
});