from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from scheduler.jobs import run_all_hourly_jobs

_scheduler: BackgroundScheduler = None


def start_scheduler():
    global _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        func=run_all_hourly_jobs,
        trigger=IntervalTrigger(hours=1),
        id="hourly_jobs",
        name="Hourly background tasks",
        replace_existing=True,
    )
    _scheduler.start()
    print("[Scheduler] Started — hourly jobs registered.")


def shutdown_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown()
        print("[Scheduler] Shut down.")