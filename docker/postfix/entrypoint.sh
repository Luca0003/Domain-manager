#!/bin/sh
set -eu

POSTFIX_HOSTNAME="${POSTFIX_HOSTNAME:-mail.domainmanager.local}"
POSTFIX_DOMAIN="${POSTFIX_DOMAIN:-domainmanager.local}"

postconf -e "myhostname = ${POSTFIX_HOSTNAME}"
postconf -e "mydomain = ${POSTFIX_DOMAIN}"
postconf -e "myorigin = ${POSTFIX_DOMAIN}"
postconf -e "inet_interfaces = all"
postconf -e "inet_protocols = ipv4"
postconf -e "mydestination = localhost.${POSTFIX_DOMAIN}, localhost"
postconf -e "mynetworks = 127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16"
postconf -e "smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination"
postconf -e "smtp_tls_security_level = may"
postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"
postconf -e "smtp_address_preference = ipv4"
postconf -e "smtp_helo_name = ${POSTFIX_HOSTNAME}"
postconf -e "disable_vrfy_command = yes"
postconf -e "smtpd_helo_required = yes"
postconf -e "message_size_limit = ${POSTFIX_MESSAGE_SIZE_LIMIT:-10485760}"
postconf -e "maillog_file = /dev/stdout"

postfix check
exec postfix start-fg
