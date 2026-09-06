package com.relivia.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Relivia native bridge: Health Connect + background sync + notification.
        // All UI remains in Next.js (PRD §33).
        registerPlugin(ReliviaHealthPlugin.class);
    }
}
