import React, { useState } from 'react';
import { Container, Title, Paper, TextInput, NumberInput, Switch, Button, Group, Stack, Slider, Text } from '@mantine/core';
import { FiSave, FiPlay, FiStop } from 'react-icons/fi';

function App() {
  const [config, setConfig] = useState({
    apiKey: '',
    apiSecret: '',
    symbol: 'DOGEUSDT',
    timeframe: '15m',
    tradeAmount: 5,
    trailingStop: 1,
    maxDailyLoss: 10,
    cooldownPeriod: 5,
    indicators: {
      rsi: {
        period: 14,
        overbought: 70,
        oversold: 30
      },
      ema: {
        fastPeriod: 5,
        slowPeriod: 13
      }
    }
  });

  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      if (path.includes('.')) {
        const [category, field] = path.split('.');
        newConfig[category] = { ...newConfig[category], [field]: value };
      } else {
        newConfig[path] = value;
      }
      return newConfig;
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (response.ok) {
        alert('Configuration saved successfully!');
      }
    } catch (error) {
      alert('Error saving configuration: ' + error.message);
    }
  };

  const toggleBot = async () => {
    try {
      const response = await fetch('/api/bot/' + (isRunning ? 'stop' : 'start'), {
        method: 'POST'
      });
      if (response.ok) {
        setIsRunning(!isRunning);
      }
    } catch (error) {
      alert('Error toggling bot: ' + error.message);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="lg">DOGE Trading Bot Configuration</Title>
      
      <Paper shadow="sm" radius="md" p="xl" mb="xl">
        <Stack spacing="md">
          <Title order={3}>API Configuration</Title>
          <TextInput
            label="API Key"
            value={config.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            type="password"
          />
          <TextInput
            label="API Secret"
            value={config.apiSecret}
            onChange={(e) => handleChange('apiSecret', e.target.value)}
            type="password"
          />
        </Stack>
      </Paper>

      <Paper shadow="sm" radius="md" p="xl" mb="xl">
        <Stack spacing="md">
          <Title order={3}>Trading Parameters</Title>
          <NumberInput
            label="Trade Amount (%)"
            value={config.tradeAmount}
            onChange={(value) => handleChange('tradeAmount', value)}
            min={1}
            max={100}
          />
          <NumberInput
            label="Trailing Stop (%)"
            value={config.trailingStop}
            onChange={(value) => handleChange('trailingStop', value)}
            min={0.1}
            max={5}
            step={0.1}
            precision={1}
          />
          <NumberInput
            label="Maximum Daily Loss (%)"
            value={config.maxDailyLoss}
            onChange={(value) => handleChange('maxDailyLoss', value)}
            min={1}
            max={20}
          />
          <NumberInput
            label="Cooldown Period (seconds)"
            value={config.cooldownPeriod}
            onChange={(value) => handleChange('cooldownPeriod', value)}
            min={5}
            max={300}
          />
        </Stack>
      </Paper>

      <Paper shadow="sm" radius="md" p="xl" mb="xl">
        <Stack spacing="md">
          <Title order={3}>Indicator Settings</Title>
          
          <Text>RSI Parameters</Text>
          <NumberInput
            label="RSI Period"
            value={config.indicators.rsi.period}
            onChange={(value) => handleChange('indicators.rsi.period', value)}
            min={5}
            max={30}
          />
          <Group grow>
            <NumberInput
              label="Oversold Level"
              value={config.indicators.rsi.oversold}
              onChange={(value) => handleChange('indicators.rsi.oversold', value)}
              min={10}
              max={40}
            />
            <NumberInput
              label="Overbought Level"
              value={config.indicators.rsi.overbought}
              onChange={(value) => handleChange('indicators.rsi.overbought', value)}
              min={60}
              max={90}
            />
          </Group>

          <Text>EMA Parameters</Text>
          <Group grow>
            <NumberInput
              label="Fast EMA Period"
              value={config.indicators.ema.fastPeriod}
              onChange={(value) => handleChange('indicators.ema.fastPeriod', value)}
              min={3}
              max={15}
            />
            <NumberInput
              label="Slow EMA Period"
              value={config.indicators.ema.slowPeriod}
              onChange={(value) => handleChange('indicators.ema.slowPeriod', value)}
              min={10}
              max={30}
            />
          </Group>
        </Stack>
      </Paper>

      <Group justify="space-between">
        <Button
          leftSection={<FiSave />}
          onClick={handleSubmit}
          variant="filled"
          color="blue"
        >
          Save Configuration
        </Button>
        <Button
          leftSection={isRunning ? <FiStop /> : <FiPlay />}
          onClick={toggleBot}
          variant="filled"
          color={isRunning ? "red" : "green"}
        >
          {isRunning ? 'Stop Bot' : 'Start Bot'}
        </Button>
      </Group>
    </Container>
  );
}

export default App;