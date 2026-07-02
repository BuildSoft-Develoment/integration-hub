-- Guard operacional posterior a V18.
-- Se mantiene en una migracion nueva para no alterar el checksum de V18 en
-- ambientes que ya aplicaron el indice de idempotencia.
do $$
begin
    if exists (
        select 1
        from (
            select
                coalesce(sender_lt, '') as sender_lt_key,
                senders_reference,
                extract(year from coalesce(requested_execution_date, created_at::date))::integer as execution_year,
                count(*) as duplicate_count
            from mt101_archive
            where senders_reference is not null
            group by 1, 2, 3
            having count(*) > 1
        ) duplicates
    ) then
        raise exception
            'V19 mt101_archive idempotency guard failed: duplicate (sender_lt, senders_reference, year) keys exist in mt101_archive. Resolve duplicates before continuing.';
    end if;
end $$;
