FROM alpine:3.22

RUN apk add --no-cache postfix ca-certificates tzdata \
    && update-ca-certificates

COPY docker/postfix/entrypoint.sh /usr/local/bin/domain-manager-postfix
RUN chmod 0755 /usr/local/bin/domain-manager-postfix

EXPOSE 25
ENTRYPOINT ["/usr/local/bin/domain-manager-postfix"]
