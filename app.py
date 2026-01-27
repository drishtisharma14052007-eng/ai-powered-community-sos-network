from flask import Flask, render_template, request, jsonify, redirect

app = Flask(__name__)

# Temporary in-memory storage
alerts = []
alert_id = 1


# ---------------- USER DASHBOARD ----------------
@app.route('/')
def index():
    return render_template('index.html', alerts=alerts)


# ---------------- SEND SOS (FROM JS) ----------------
@app.route('/send_alert', methods=['POST'])
def send_alert():
    global alert_id
    data = request.json

    print("ALERT RECEIVED:", data)  # DEBUG

    alert = {
        "id": alert_id,
        "issue": data.get('issue'),
        "location": data.get('location', 'Unknown'),
        "status": "active",
        "accepted_by": None
    }

    alerts.append(alert)
    alert_id += 1

    print("ALL ALERTS:", alerts)  # DEBUG

    return jsonify({"success": True})



# ---------------- ADMIN DASHBOARD ----------------
@app.route('/admin')
def admin():
    tab = request.args.get('tab', 'all')

    if tab == 'active':
        filtered_alerts = [a for a in alerts if a['status'] == 'active']

    elif tab == 'resolved':
        filtered_alerts = [a for a in alerts if a['status'] == 'resolved']

    elif tab == 'cancelled':
        filtered_alerts = [a for a in alerts if a['status'] == 'cancelled']

    else:
        filtered_alerts = alerts

    return render_template('admin.html', alerts=filtered_alerts, tab=tab)


@app.route('/resolve_alert/<int:alert_id>', methods=['POST'])
def resolve_alert(alert_id):
    for alert in alerts:
        if alert['id'] == alert_id:
            alert['status'] = 'resolved'
            break
    return '', 204


@app.route('/cancel_alert/<int:alert_id>', methods=['POST'])
def cancel_alert(alert_id):
    for alert in alerts:
        if alert['id'] == alert_id:
            alert['status'] = 'cancelled'
            break
    return '', 204


# ---------------- HELPER DASHBOARD ----------------
@app.route('/helper')
def helper_dashboard():
    active_alerts = [
        a for a in alerts
        if a.get('status') == 'active'
    ]
    return render_template('helper.html', alerts=active_alerts)


# ---------------- ACCEPT ALERT ----------------
@app.route('/accept_alert/<int:alert_id>', methods=['POST'])
def accept_alert(alert_id):
    helper_name = request.form.get('helper_name', 'Community Helper')

    for alert in alerts:
        if alert['id'] == alert_id and alert['status'] == 'active':
            alert['status'] = 'accepted'
            alert['accepted_by'] = helper_name
            break

    return redirect('/helper')


if __name__ == '__main__':
    app.run(debug=True)
