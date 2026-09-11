-- Vulnerable Endpoint: /api/lookup?user=' OR 1=1--
-- Table structure for table lags
CREATE TABLE IF NOT EXISTS secret_vault (
  id int(11) NOT NULL AUTO_INCREMENT,
  secret_type varchar(255) NOT NULL,
  secret_value text NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO secret_vault (secret_type, secret_value) VALUES
('FLAG', 'logicCTF{sql1_un10n_s3l3ct_4dm1n_fl4g}');
