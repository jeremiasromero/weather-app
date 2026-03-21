from datetime import date, timedelta


def validate_date_range(date_start: date | None, date_end: date | None) -> None:
    """
    Validate the date range for Mode B queries.

    Rules:
      - Start date: up to 2 months (61 days) in the past
      - End date: up to 10 days in the future
      - Max span: 30 days between start and end
      - End must be >= Start
    """
    if date_start and date_end:
        today = date.today()

        # End must be on or after start
        if date_end < date_start:
            raise ValueError("End date must be on or after start date.")

        # Max span: 30 days
        delta = (date_end - date_start).days
        if delta > 30:
            raise ValueError(
                f"Date range is {delta} days. Maximum allowed is 30 days."
            )

        # Start date: max 2 months (61 days) in the past
        earliest = today - timedelta(days=61)
        if date_start < earliest:
            raise ValueError(
                f"Start date cannot be more than 2 months in the past. "
                f"Earliest allowed: {earliest.isoformat()}"
            )

        # End date: max 10 days in the future
        latest = today + timedelta(days=10)
        if date_end > latest:
            raise ValueError(
                f"End date cannot be more than 10 days in the future. "
                f"Latest allowed: {latest.isoformat()}"
            )

    elif date_start and not date_end:
        raise ValueError("Both start date and end date are required for date-range queries.")
    elif date_end and not date_start:
        raise ValueError("Both start date and end date are required for date-range queries.")
