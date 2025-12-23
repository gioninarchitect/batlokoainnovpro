import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get all settings
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();

    // Convert to key-value object for easier frontend use
    const settingsObj = {};
    settings.forEach((setting) => {
      let value = setting.value;
      // Parse value based on type
      if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'number') {
        value = Number(value);
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if parse fails
        }
      }
      settingsObj[setting.key] = value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Get single setting by key
router.get('/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    let value = setting.value;
    if (setting.type === 'boolean') {
      value = value === 'true';
    } else if (setting.type === 'number') {
      value = Number(value);
    } else if (setting.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string
      }
    }

    res.json({ key: setting.key, value, type: setting.type });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
});

// Update single setting
router.put('/:key', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type = 'string' } = req.body;

    // Convert value to string for storage
    let stringValue = String(value);
    if (type === 'json' && typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: stringValue, type },
      create: { key, value: stringValue, type },
    });

    res.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

// Bulk update settings
router.put('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const settingsToUpdate = req.body;

    if (!settingsToUpdate || typeof settingsToUpdate !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    const updates = [];

    for (const [key, value] of Object.entries(settingsToUpdate)) {
      // Determine type based on value
      let type = 'string';
      let stringValue = String(value);

      if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value ? 'true' : 'false';
      } else if (typeof value === 'number') {
        type = 'number';
        stringValue = String(value);
      } else if (typeof value === 'object' && value !== null) {
        type = 'json';
        stringValue = JSON.stringify(value);
      }

      updates.push(
        prisma.setting.upsert({
          where: { key },
          update: { value: stringValue, type },
          create: { key, value: stringValue, type },
        })
      );
    }

    const results = await prisma.$transaction(updates);

    res.json({ message: 'Settings updated successfully', count: results.length });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Delete setting
router.delete('/:key', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;

    await prisma.setting.delete({
      where: { key },
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ message: 'Failed to delete setting' });
  }
});

export default router;
