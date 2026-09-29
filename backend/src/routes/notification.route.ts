import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';

const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationService.list(req.user!.id, req.query.limit, req.query.offset);
    res.json({ notifications });
  } catch (err) { next(err); }
});

notificationRouter.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ unreadCount: await notificationService.unreadCount(req.user!.id) });
  } catch (err) { next(err); }
});

notificationRouter.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ updatedCount: await notificationService.markAllRead(req.user!.id) });
  } catch (err) { next(err); }
});

notificationRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ notification: await notificationService.markRead(req.params.id, req.user!.id) });
  } catch (err) { next(err); }
});

export default notificationRouter;
