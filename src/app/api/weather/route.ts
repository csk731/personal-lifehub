import { NextRequest, NextResponse } from 'next/server';
import { weatherService } from '@/lib/weatherService';
import { WeatherSettings } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const unit = searchParams.get('unit') as 'celsius' | 'fahrenheit' || 'celsius';
    const showForecast = searchParams.get('showForecast') === 'true';
    const showHourly = searchParams.get('showHourly') === 'true';
    const autoRefresh = searchParams.get('autoRefresh') === 'true';
    const refreshInterval = parseInt(searchParams.get('refreshInterval') || '10');

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      );
    }

    const settings: WeatherSettings = {
      location,
      unit,
      showForecast,
      showHourly,
      autoRefresh,
      refreshInterval,
    };

    const weatherData = await weatherService.getCurrentWeather(location, settings);

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 