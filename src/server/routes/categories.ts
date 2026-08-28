import { Router } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requireRole } from './auth.ts';
import type { ServiceCategory } from '../../types/index.ts';

export const categoryRouter = Router();

// GET /api/categories
categoryRouter.get('/', (req, res) => {
  const categories = db.getServiceCategories();
  return res.json(categories);
});

// POST /api/categories (Admin creates custom service category)
categoryRouter.post('/', authMiddleware, requireRole('admin'), (req: any, res) => {
  try {
    const { name, nameTa, requiredSkill, defaultRefPrice, description, iconName } = req.body;

    if (!name || !requiredSkill) {
      return res.status(400).json({ error: 'Name and requiredSkill are required' });
    }

    const catId = `cat-${Date.now()}`;
    const newCategory: ServiceCategory = {
      id: catId,
      name,
      nameTa: nameTa || name,
      requiredSkill,
      defaultRefPrice: Number(defaultRefPrice) || 300,
      description: description || '',
      iconName: iconName || 'Zap',
    };

    db.getServiceCategories().push(newCategory);
    db.save();

    db.logAudit({
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'CATEGORY_CREATED',
      newValue: name,
      details: `Created new service category: ${name} (Ref: ₹${newCategory.defaultRefPrice})`,
    });

    return res.status(201).json(newCategory);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
categoryRouter.put('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const cat = db.getServiceCategories().find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  const { name, nameTa, requiredSkill, defaultRefPrice, description, iconName } = req.body;
  if (name) cat.name = name;
  if (nameTa) cat.nameTa = nameTa;
  if (requiredSkill) cat.requiredSkill = requiredSkill;
  if (defaultRefPrice !== undefined) cat.defaultRefPrice = Number(defaultRefPrice);
  if (description !== undefined) cat.description = description;
  if (iconName) cat.iconName = iconName;

  db.save();
  return res.json(cat);
});

// DELETE /api/categories/:id
categoryRouter.delete('/:id', authMiddleware, requireRole('admin'), (req: any, res) => {
  const index = db.getServiceCategories().findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  db.getServiceCategories().splice(index, 1);
  db.save();
  return res.json({ success: true });
});
