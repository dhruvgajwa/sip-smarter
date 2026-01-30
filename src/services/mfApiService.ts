import type { NavDataPoint, FundMeta, FundData } from '@/types/mutualFund';
import { parseNavDate, getWeekOfMonth, getQuarter } from './dateUtils';
import { getDate, getDay, getMonth, getYear } from 'date-fns';

interface ApiNavEntry {
  date: string;
  nav: string;
}

interface ApiResponse {
  meta: {
    fund_house: string;
    scheme_name: string;
    scheme_code: number;
    scheme_category: string;
  };
  data: ApiNavEntry[];
}

/**
 * Fetch NAV data for a mutual fund from MFAPI
 */
export async function fetchFundData(schemeCode: number): Promise<FundData> {
  const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data for scheme ${schemeCode}: ${response.statusText}`);
  }
  
  const data: ApiResponse = await response.json();
  
  const meta: FundMeta = {
    fundHouse: data.meta.fund_house,
    schemeName: data.meta.scheme_name,
    schemeCode: data.meta.scheme_code,
    schemeCategory: data.meta.scheme_category,
  };
  
  const navData: NavDataPoint[] = data.data
    .map(entry => {
      const date = parseNavDate(entry.date);
      const month = getMonth(date);
      
      return {
        date,
        nav: parseFloat(entry.nav),
        dayOfMonth: getDate(date),
        dayOfWeek: getDay(date),
        weekOfMonth: getWeekOfMonth(date),
        month,
        quarter: getQuarter(month),
        year: getYear(date),
      };
    })
    .filter(entry => !isNaN(entry.nav))
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort ascending
  
  return { meta, navData };
}

/**
 * Fetch data for all funds
 */
export async function fetchAllFundsData(
  schemeCodes: number[],
  onProgress?: (message: string, type: 'info' | 'success' | 'error') => void
): Promise<Map<number, FundData>> {
  const results = new Map<number, FundData>();
  
  for (const code of schemeCodes) {
    try {
      onProgress?.(`Fetching data for scheme ${code}...`, 'info');
      const data = await fetchFundData(code);
      results.set(code, data);
      onProgress?.(`✓ Loaded ${data.navData.length} records for ${data.meta.schemeName}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(`✗ Failed to fetch scheme ${code}: ${message}`, 'error');
    }
  }
  
  return results;
}
